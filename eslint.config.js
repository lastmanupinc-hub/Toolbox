export default [
  {
    files: ["**/*.{js,mjs,cjs,ts,tsx}"],
    ignores: ["**/dist/**", "**/coverage/**", "**/.ai-output*/**"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {},
  },
];
