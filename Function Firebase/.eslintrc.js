module.exports = {
  root: true,
  env: {
    es6: true,
    node: true, // <-- ADICIONA SUPORTE PARA AMBIENTE NODE.JS
  },
  extends: [
    "eslint:recommended",
    "google",
  ],
  rules: {
    quotes: ["error", "double"],
    "no-unused-vars": ["error", { "argsIgnorePattern": "context" }], // <-- IGNORA O PARÂMETRO 'context'
  },
  parserOptions: {
    ecmaVersion: 2017,
  },
};