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
      // Destructuring off a field to strip it before sending to the client (e.g.
      // `const { deletedAt: _deleted, ...rest } = user`) is intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: "^_" },
      ],
    },
  },
];

export default eslintConfig;
