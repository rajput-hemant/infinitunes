module.exports = {
  env: { browser: true, es2020: true, node: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
    "prettier",
    "plugin:tailwindcss/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": "warn",
    "tailwindcss/no-custom-classname": "off",
    "tailwindcss/classnames-order": "warn",
    "@typescript-eslint/ban-ts-comment": "off",
  },
  settings: {
    tailwindcss: {
      callees: ["cn", "cva"],
    },
  },
};
