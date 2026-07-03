import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const eslintConfig = [
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "prisma/ERD.svg",
      "**/*.tsbuildinfo",
    ],
  },
  {
    rules: {
      // Fetch-on-mount via a callback effect is a standard client-fetch pattern here,
      // not the render-time render-then-setState issue this rule targets.
      "react-hooks/set-state-in-effect": "warn",
    },
  },
];

export default eslintConfig;
