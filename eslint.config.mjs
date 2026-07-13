import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // The Expo app has its own toolchain; keep the website's lint/build out of it.
    "apps/**",
    // Raw Claude/Figma design export kept for reference only — never compiled by
    // Next and not imported by the app; its standalone snippets aren't meant to
    // lint in isolation, so exclude them to keep lint output about real code.
    "claudi-design-export/**",
  ]),
]);

export default eslintConfig;
