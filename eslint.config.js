// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");
// Desliga as regras de estilo do ESLint que conflitariam com o Prettier
// (formatação é responsabilidade do Prettier, não do lint).
const eslintConfigPrettier = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  eslintConfigPrettier,
  {
    ignores: ["dist/*"],
  }
]);
