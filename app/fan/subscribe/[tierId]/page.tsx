import { getTierForSubscription } from "@/lib/actions/memberships-client";
import FanSubscribeClient from "./client";

export default async function FanSubscribePage({
  params,
}: {
  params: { tierId: string };
}) {
  const result = await getTierForSubscription(params.tierId);

  if (!result.ok || !result.tier) {
    return (
      <div className="min-h-screen bg-bg flex items-center justify-center">
        <p className="text-ink-muted">{result.error || "Tier not found"}</p>
      </div>
    );
  }

  return <FanSubscribeClient tier={result.tier} />;
}
