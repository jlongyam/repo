import commit from "../../src/commit.js";

console.log(commit({
  type: 'feat',
  scope: 'authentication',
  content: 'add password strength meter',
  body: 'Added zxcvbn library for password strength estimation\nConfigured visual feedback for users',
  footer: 'Closes #123'
}));