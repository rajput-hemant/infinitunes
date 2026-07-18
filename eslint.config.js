import { FlatCompat } from "@eslint/eslintrc";
import eslint from "@eslint/js";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettierConfig from "eslint-config-prettier/flat";
import prettierPlugin from "eslint-plugin-prettier/recommended";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";

const compat = new FlatCompat({ baseDirectory: import.meta.dirname });

const eslintConfig = defineConfig([
  prettierConfig,
  prettierPlugin,
  eslint.configs.recommended,
  reactHooks.configs.flat.recommended,

  ...nextVitals,
  ...nextTs,
  ...compat.config({ extends: ["plugin:drizzle/recommended"] }),

  // {
  //   rules: {
  //     "react/no-unescaped-entities": "off",

  //     "@next/next/no-page-custom-font": "off",

  //     "@typescript-eslint/array-type": "off",
  //     "@typescript-eslint/consistent-type-definitions": "off",
  //     "@typescript-eslint/consistent-type-imports": [
  //       "warn",
  //       { prefer: "type-imports" },
  //     ],
  //     "@typescript-eslint/no-unused-vars": [
  //       "warn",
  //       { argsIgnorePattern: "^_" },
  //     ],

  //     // https://orm.drizzle.team/docs/eslint-plugin#enforce-delete-with-where
  //     "drizzle/enforce-delete-with-where": [
  //       "error",
  //       { drizzleObjectName: "db" },
  //     ],
  //     // https://orm.drizzle.team/docs/eslint-plugin#enforce-update-with-where
  //     "drizzle/enforce-update-with-where": [
  //       "error",
  //       { drizzleObjectName: "db" },
  //     ],
  //   },
  // },

  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
