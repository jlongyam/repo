import { generateKeepAChangelog as changelog  } from "../../src/changelog.js";

changelog({
  repoUrl: 'https://github.com/username/repo',
  includeUnreleased: true,
  groupByType: true
});
