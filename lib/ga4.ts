import { BetaAnalyticsDataClient } from "@google-analytics/data";

const GA4_PROPERTY_ID = process.env.GA4_PROPERTY_ID || "";
const GA4_SERVICE_ACCOUNT_KEY = process.env.GA4_SERVICE_ACCOUNT_KEY || "";

function getClient() {
  if (!GA4_PROPERTY_ID || !GA4_SERVICE_ACCOUNT_KEY) {
    throw new Error("Missing GA4 credentials");
  }

  let credentials: Record<string, any>;
  try {
    credentials = JSON.parse(GA4_SERVICE_ACCOUNT_KEY);
  } catch {
    try {
      credentials = JSON.parse(Buffer.from(GA4_SERVICE_ACCOUNT_KEY, "base64").toString("utf-8"));
    } catch {
      throw new Error("Invalid GA4 service account key format");
    }
  }

  return new BetaAnalyticsDataClient({ credentials });
}

export type Ga4Metric = {
  title: string;
  value: string | number;
  change?: number;
  icon?: string;
};

export type Ga4Response = {
  dateRange: string;
  metrics: Ga4Metric[];
  topPages: { page: string; views: number }[];
  topCountries: { country: string; users: number }[];
  devices: { device: string; users: number }[];
};

export async function getGa4Overview(days = 30): Promise<Ga4Response> {
  const client = getClient();
  const propertyId = GA4_PROPERTY_ID;

  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - days);

  const dateRange = `${startDate.toISOString().split("T")[0]} / ${endDate.toISOString().split("T")[0]}`;

  try {
    const [metricsRes, pagesRes, countriesRes, devicesRes] = await Promise.all([
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate.toISOString().split("T")[0], endDate: endDate.toISOString().split("T")[0] }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate.toISOString().split("T")[0], endDate: endDate.toISOString().split("T")[0] }],
        dimensions: [{ name: "pagePath" }],
        metrics: [{ name: "screenPageViews" }],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate.toISOString().split("T")[0], endDate: endDate.toISOString().split("T")[0] }],
        dimensions: [{ name: "country" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
      client.runReport({
        property: `properties/${propertyId}`,
        dateRanges: [{ startDate: startDate.toISOString().split("T")[0], endDate: endDate.toISOString().split("T")[0] }],
        dimensions: [{ name: "deviceCategory" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
      }),
    ]);

    const metricsResponse = metricsRes[0];
    const pagesResponse = pagesRes[0];
    const countriesResponse = countriesRes[0];
    const devicesResponse = devicesRes[0];

    const metricRow = (metricsResponse.rows?.[0]?.metricValues as Record<string, { value: string }>[]) || [];
    const getMetric = (name: string) => metricRow.find((m) => Object.keys(m)[0] === name)?.[name]?.value || "0";

    const activeUsers = Number(getMetric("activeUsers"));
    const sessions = Number(getMetric("sessions"));
    const pageViews = Number(getMetric("screenPageViews"));
    const avgSessionDuration = Number(getMetric("averageSessionDuration"));
    const bounceRate = Number(getMetric("bounceRate"));

    const formatDuration = (seconds: number) => {
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins}m ${secs}s`;
    };

    const metrics: Ga4Metric[] = [
      { title: "Active Users", value: activeUsers.toLocaleString(), icon: "users" },
      { title: "Sessions", value: sessions.toLocaleString(), icon: "activity" },
      { title: "Page Views", value: pageViews.toLocaleString(), icon: "eye" },
      { title: "Avg. Session", value: formatDuration(avgSessionDuration), icon: "clock" },
      { title: "Bounce Rate", value: `${(bounceRate * 100).toFixed(1)}%`, icon: "trending-down" },
    ];

    const topPages =
      pagesResponse.rows?.slice(0, 10).map((row) => ({
        page: row.dimensionValues?.[0]?.value || "/",
        views: Number(row.metricValues?.[0]?.value || 0),
      })) || [];

    const topCountries =
      countriesResponse.rows?.slice(0, 10).map((row) => ({
        country: row.dimensionValues?.[0]?.value || "Unknown",
        users: Number(row.metricValues?.[0]?.value || 0),
      })) || [];

    const devices =
      devicesResponse.rows?.map((row) => ({
        device: row.dimensionValues?.[0]?.value || "Unknown",
        users: Number(row.metricValues?.[0]?.value || 0),
      })) || [];

    return {
      dateRange,
      metrics,
      topPages,
      topCountries,
      devices,
    };
  } catch (error) {
    console.error("GA4 API error:", error);
    throw new Error("Failed to fetch GA4 data");
  }
}

export async function getGa4Realtime(): Promise<{ activeUsers: number }> {
  const client = getClient();
  const propertyId = GA4_PROPERTY_ID;

  try {
    const [response] = await client.runRealtimeReport({
      property: `properties/${propertyId}`,
      metrics: [{ name: "activeUsers" }],
    });

    const activeUsers = Number(response.rows?.[0]?.metricValues?.[0]?.value || 0);
    return { activeUsers };
  } catch (error) {
    console.error("GA4 Realtime API error:", error);
    return { activeUsers: 0 };
  }
}
