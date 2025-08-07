import { changelog  } from "../../src/changelog.js";

let change = changelog({
  repoUrl: 'https://github.com/username/repo',
  includeUnreleased: true,
  groupByType: true
});
console.log(typeof change)