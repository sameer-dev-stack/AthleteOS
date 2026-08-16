import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";

const ACCENT = "#C6FF3D";
const BG = "#0A0A0B";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const username = searchParams.get("username");

  if (!username) {
    return new ImageResponse(
      CardImage("Athlete", "NIL CARD", null, null),
      { width: 1200, height: 630 }
    );
  }

  let name = "Athlete";
  let sport = null;
  let school = null;

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
      .from("profiles")
      .select("full_name, sport, school")
      .eq("username", username.toLowerCase().trim())
      .eq("profile_published", true)
      .single();

    if (data) {
      name = data.full_name || username;
      sport = data.sport;
      school = data.school;
    }
  } catch {
    // Fallback to defaults
  }

  return new ImageResponse(
    CardImage(name, username, sport, school),
    { width: 1200, height: 630 }
  );
}

function CardImage(
  name: string,
  username: string,
  sport: string | null,
  school: string | null
) {
  const subtitle = [sport, school].filter(Boolean).join(" · ") || "NIL CARD";

  return (
    <div
      style={{
        width: "1200px",
        height: "630px",
        backgroundColor: BG,
        display: "flex",
        flexDirection: "column",
        justifyContent: "flex-start",
        padding: "80px",
        fontFamily: "system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          top: "-200px",
          right: "-200px",
          width: "600px",
          height: "600px",
          borderRadius: "50%",
          background: `radial-gradient(circle, ${ACCENT}15, transparent 70%)`,
        }}
      />

      {/* Accent line */}
      <div
        style={{
          width: "48px",
          height: "4px",
          borderRadius: "2px",
          backgroundColor: ACCENT,
          marginBottom: "32px",
        }}
      />

      {/* Name */}
      <div
        style={{
          fontSize: "56px",
          fontWeight: 900,
          color: "white",
          lineHeight: 1.1,
          marginBottom: "16px",
        }}
      >
        {name}
      </div>

      {/* Subtitle */}
      <div
        style={{
          fontSize: "22px",
          fontWeight: 600,
          color: "#88888A",
          marginBottom: "12px",
        }}
      >
        {subtitle}
      </div>

      {/* Username */}
      <div
        style={{
          fontSize: "18px",
          fontWeight: 500,
          color: ACCENT,
          marginBottom: "0",
        }}
      >
        nilcard.app/{username}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "50px",
          backgroundColor: "rgba(255,255,255,0.03)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 80px",
        }}
      >
        <div
          style={{
            fontSize: "14px",
            fontWeight: 700,
            color: "#555557",
            letterSpacing: "2px",
          }}
        >
          ATHLETEOS
        </div>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "#555557",
          }}
        >
          The NIL operating system
        </div>
      </div>
    </div>
  );
}
