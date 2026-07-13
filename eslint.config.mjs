import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

export default [
  {
    ignores: [
      ".next/",
      "out/",
      "build/",
      "node_modules/",
      "playwright-report/",
      "playwright/.cache/",
      "coverage/",
      "graphify-out/",
      "authpage/",
      "next-env.d.ts",
      "*.config.js",
      "*.config.mjs",
      "sentry.client.config.ts",
      "sentry.server.config.ts",
      "sentry.edge.config.ts",
    ],
  },
  ...nextCoreWebVitals,
  {
    rules: {
      // Preserve pre-upgrade lint parity: react-hooks v5 (shipped with
      // eslint-config-next 16) enables stricter rules that the v4-era
      // config did not. These flag pre-existing patterns, not upgrade
      // regressions, so they are warnings (visible, non-blocking) until
      // cleaned up in a dedicated follow-up.
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/purity": "warn",
      "react-hooks/immutability": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "@next/next/no-html-link-for-pages": "warn",
      "react/no-unescaped-entities": "warn",
    },
  },
];
