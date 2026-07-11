"use client";

import { useState, useEffect } from "react";
import { Activity, Check, AlertTriangle, Clock } from "lucide-react";

type ServiceStatus = "operational" | "degraded" | "down";
type Status = {
  overall: "operational" | "degraded" | "down";
  services: { name: string; status: ServiceStatus }[];
  lastChecked: string;
};

const SERVICES = [
  { name: "Athlete Cards", url: "/api/health" },
  { name: "AI Toolkit", url: "/api/health" },
  { name: "Payments", url: "/api/health" },
  { name: "Email", url: "/api/health" },
];

export function SystemStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      const results = await Promise.all(
        SERVICES.map(async (s) => {
          try {
            const res = await fetch(s.url, { method: "GET" });
            return { name: s.name, status: (res.ok ? "operational" : "degraded") as ServiceStatus };
          } catch {
            return { name: s.name, status: "down" as ServiceStatus };
          }
        })
      );

      if (cancelled) return;

      const hasDown = results.some((r) => r.status === "down");
      const hasDegraded = results.some((r) => r.status === "degraded");

      setStatus({
        overall: hasDown ? "down" : hasDegraded ? "degraded" : "operational",
        services: results,
        lastChecked: new Date().toISOString(),
      });
    }

    checkStatus();
    const interval = setInterval(checkStatus, 60000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  if (!status) return null;

  const overallConfig = {
    operational: { label: "All systems operational", icon: Check, color: "text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20" },
    degraded: { label: "Some systems degraded", icon: AlertTriangle, color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-500/20" },
    down: { label: "System outage", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10", border: "border-red-500/20" },
  };

  const config = overallConfig[status.overall];
  const Icon = config.icon;

  return (
    <div className="rounded-2xl border border-white/[0.06] bg-[#111113] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-4 w-4 text-accent" />
        <h3 className="text-sm font-semibold text-white">System Status</h3>
      </div>

      <div className={`flex items-center gap-2 rounded-xl border ${config.border} ${config.bg} px-3 py-2 mb-4`}>
        <Icon className={`h-3.5 w-3.5 ${config.color}`} />
        <span className={`text-xs font-semibold ${config.color}`}>{config.label}</span>
      </div>

      <div className="space-y-2">
        {status.services.map((service) => (
          <div key={service.name} className="flex items-center justify-between py-1.5">
            <span className="text-xs text-ink-muted">{service.name}</span>
            <div className="flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${
                  service.status === "operational" ? "bg-emerald-400" : service.status === "degraded" ? "bg-yellow-400" : "bg-red-400"
                }`} />
                <span className={`relative inline-flex h-1.5 w-1.5 rounded-full ${
                  service.status === "operational" ? "bg-emerald-400" : service.status === "degraded" ? "bg-yellow-400" : "bg-red-400"
                }`} />
              </span>
              <span className="text-[10px] text-ink-dim capitalize">{service.status}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-[10px] text-ink-dim">
        <Clock className="h-2.5 w-2.5" />
        Last checked: just now
      </div>
    </div>
  );
}
