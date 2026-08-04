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
    // Packaged desktop output (dist, and any dist2/dist-tmp variants).
    "dist*/**",
  ]),
  {
    // The Electron main and preload processes are CommonJS by requirement —
    // preload scripts in particular cannot be ES modules — and electron-builder
    // loads its lifecycle hooks with require(), so the TypeScript import rules
    // from the Next config do not apply to either.
    files: ["electron/**/*.js", "scripts/*.js"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { __dirname: "readonly", process: "readonly" },
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
]);

export default eslintConfig;
