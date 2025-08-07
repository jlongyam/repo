import { gitCommit } from "../../src/commit.js";

// console.log(commit({
//   type: 'fix',
//   scope: 'parser',
//   content: 'handle edge case in template parsing',
//   body: 'Added additional validation for template variables\nFixed regex to handle special characters',
//   footer: 'Fixes #42'
// }));

// console.log(commit({
//   type: 'feat',
//   content: 'implement new API endpoint',
//   breaking: true
// }));

// Example error cases:
// console.log(commit()); // Shows help
// console.log(commit({ help: true })); // Shows help
// console.log(commit({ type: 'feat' })); // Error: missing content
// console.log(commit({ content: 'some change' })); // Error: missing type
// console.log(commit({ type: 'feature', content: 'invalid type' })); // Warning

// Create a real git commit
// gitCommit({
//   type: 'feat',
//   content: 'add new dashboard widget',
//   scope: 'ui',
//   addAll: true  // Stage all changes automatically
// });

// test first
// gitCommit({
//   type: 'fix',
//   content: 'correct calculation bug',
//   dryRun: true  // Just show what would be committed
// });

// with breaking change
gitCommit({
  type: 'feat',
  content: 'change authentication API',
  breaking: true,
  body: 'Migrated from v1 to v2 of the auth service',
  addAll: true
});