import { generateChangelog as changelog  } from "../../src/changelog.js";

changelog({
  repoUrl: 'https://github.com/jlongyam/repo',
  includeUnreleased: true,
  groupByType: true,
  append: true // Default is true, can be set to false to regenerate completely
});
