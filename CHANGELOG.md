# Changelogs


<pre>
***********************************************************
*                                                         *
*  13/1/2026 - 14:13 - [BLAME] => jhonliongbox@gmail.com  *
*                                                         *
***********************************************************
</pre>
<strong>Message: </strong><br>
"feat: add CHANGELOG.MD"<br>

<strong>Affected files: </strong><br>
".gitignore, CHANGELOG.md, README.md, package-lock.json, src/commit.js, test/sample/commit.js"

<strong>DIFF: </strong><br>
```diff
+.DS_Store
-- chore: bump version to 0.2.1 ([d260b0c](https://github.com/jlongyam/repo/commit/d260b0c)) - _jlongyam_
+- chore: bump version to 0.2.1 ([d260b0c](https://github.com/jlongyam/repo/commit/d260b0c)) - _jlongyam_
-
+
+
+
-- fix: Correct homepage URL in package.json ([e4ced6b](https://github.com/jlongyam/repo/commit/e4ced6b)) - _jlongyam_
+- fix: Correct homepage URL in package.json ([e4ced6b](https://github.com/jlongyam/repo/commit/e4ced6b)) - _jlongyam_
+
-- refactor: Improve changelog generation ([afbac80](https://github.com/jlongyam/repo/commit/afbac80)) - _jlongyam_
+- refactor: Improve changelog generation ([afbac80](https://github.com/jlongyam/repo/commit/afbac80)) - _jlongyam_
-- feat: Improve changelog generation with version history support ([3da3f43](https://github.com/jlongyam/repo/commit/3da3f43)) - _jlongyam_
+- feat: Improve changelog generation with version history support ([3da3f43](https://github.com/jlongyam/repo/commit/3da3f43)) - _jlongyam_
+
+
-- fix: add cz commitizen ([e394604](https://github.com/jlongyam/repo/commit/e394604)) - _jlongyam_
+- fix: add cz commitizen ([e394604](https://github.com/jlongyam/repo/commit/e394604)) - _jlongyam_
-# repo
+# Repo
-Script tool to manage repository
+CLI tool to manage repository:
-- commit - convesional
-- nextVersion - semantic
-- changelog - keep
-
-### References
-
-- https://www.conventionalcommits.org/en/v1.0.0/
-- semver
-- https://keepachangelog.com/en/1.1.0/
-
-### See also
-
-- AI tool: GemCommit
-- [CHANGELOG](CHANGELOG.md)
+- commit - [conventionalcommits]((https://www.conventionalcommits.org/en/v1.0.0/))
+- changelog - [keepachangelog](https://keepachangelog.com/en/1.1.0/)
+- version - [semver](https://semver.org/)
-  "version": "0.2.0",
+  "version": "0.2.1",
-      "version": "0.2.0",
+      "version": "0.2.1",
-      "version": "7.7.2",
-      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.2.tgz",
-      "integrity": "sha512-RF0Fw+rO5AMf9MAyaRXI4AV0Ulj5lMHqVxxdSgiVbixSCXoEmmX/jk0CuJw4+3SqroYO9VoUh+HcuJivvtJemA==",
+      "version": "7.7.3",
+      "resolved": "https://registry.npmjs.org/semver/-/semver-7.7.3.tgz",
+      "integrity": "sha512-SdsKMrI9TdgjdweUSR9MweHA4EJ8YxHn8DFaDisvhVlUOe4BF1tLD7GAj0lIqWVl+dPb/rExr0Btby5loQm20Q==",
+function showHelp() {
+  return `
+Conventional Commit Message Generator
+Usage: commit({ type: string, content: string [, options] })
+
+Required:
+  type      Commit type (feat, fix, docs, style, refactor, test, chore, [ ...Conventionl_Types])
+  content   Commit description (what changed)
+
+Optional:
+  scope     Scope of changes (e.g., component name)
+  breaking  Boolean indicating breaking changes
+  body      Detailed explanation of changes
+  footer    Footer information (e.g., issue references)
+  help      Show this help message
+
+Conventional_Types:
+  feat      A new feature
+  fix       A bug fix
+  docs      Documentation changes
+  style     Code style/formatting
+  refactor  Code change that neither fixes nor adds a feature
+  test      Adding missing tests
+  chore     Maintenance tasks
+  perf      Performance improvement
+  build     Build system changes
+  ci        CI configuration changes
+  revert    Reverts a previous commit
+
+Examples:
+  // Basic feature
+  commit({
+    type: 'feat',
+    content: 'add user profile page'
+  });
+
+  // Fix with scope
+  commit({
+    type: 'fix',
+    scope: 'parser',
+    content: 'handle null values in template'
+  });
+
+  // Breaking change
+  commit({
+    type: 'feat',
+    content: 'change authentication method',
+    breaking: true,
+    body: 'Migrated from JWT to session cookies',
+    footer: 'Closes #123'
+  });
+`;
+}
+    
+
+    // Generate the commit message
+    const message = commit(options);
+    if(!options.type && !options.content) {
+      console.log(message);
+      return;
+    }
-
-    // Generate the commit message
-    const message = commit(options);
-    
-    if (options.dryRun) {
-      console.log('Dry run - would commit with message:\n');
+    if (options.test) {
+      // console.log('Dry run - would commit with message:\n');
-      console.log('\nAdd --no-dry-run to actually commit');
+      // console.log('\nAdd --no-dry-run to actually commit');
-    if (options.addAll) {
+    if (options.stages) {
-    
-    // If it's a Git error, show more context
-function showHelp() {
-  return `
-Conventional Commit Message Generator
-Usage: commit({ type: string, content: string [, options] })
-
-Required:
-  type      Commit type (feat, fix, docs, style, refactor, test, chore, etc.)
-  content   Commit description (what changed)
-
-Optional:
-  scope     Scope of changes (e.g., component name)
-  breaking  Boolean indicating breaking changes
-  body      Detailed explanation of changes
-  footer    Footer information (e.g., issue references)
-  help      Show this help message
-
-Examples:
-  // Basic feature
-  commit({
-    type: 'feat',
-    content: 'add user profile page'
-  });
-
-  // Fix with scope
-  commit({
-    type: 'fix',
-    scope: 'parser',
-    content: 'handle null values in template'
-  });
-
-  // Breaking change
-  commit({
-    type: 'feat',
-    content: 'change authentication method',
-    breaking: true,
-    body: 'Migrated from JWT to session cookies',
-    footer: 'Closes #123'
-  });
-Conventional Types:
-  feat      A new feature
-  fix       A bug fix
-  docs      Documentation changes
-  style     Code style/formatting
-  refactor  Code change that neither fixes nor adds a feature
-  test      Adding missing tests
-  chore     Maintenance tasks
-  perf      Performance improvement
-  build     Build system changes
-  ci        CI configuration changes
-  revert    Reverts a previous commit
-`;
-}
-import { gitCommit } from "../../src/commit.js";
+import { commit, gitCommit } from "../../src/commit.js";
+// console.log(commit());
+// console.log(commit({
+//   help: true
+// }))
+// console.log(commit({
+//   type: 'docs',
+//   content: 'update README'
+// }))
+// gitCommit({
+//   dryRun: true
+// })
+// gitCommit()//
+gitCommit({
+  test: true
+})
-gitCommit({
-  type: 'feat',
-  content: 'change authentication API',
-  breaking: true,
-  body: 'Migrated from v1 to v2 of the auth service',
-  addAll: true
-});
+// gitCommit({
+//   type: 'feat',
+//   content: 'change authentication API',
+//   breaking: true,
+//   body: 'Migrated from v1 to v2 of the auth service',
+//   addAll: true
+// });
```
<p><small>This might be a 🚀 or a 🧨 XD</small></p>
<p>&nbsp;</p>
ll notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- chore: bump version to 0.2.1 ([d260b0c](https://github.com/jlongyam/repo/commit/d260b0c)) - _jlongyam_

## [0.2.1] - 2025-08-08

## [0.2.0] - 2025-08-08

### Added

- feat: Add version-next functionality ([aa030c6](https://github.com/jlongyam/repo/commit/aa030c6)) - _jlongyam_

- feat: Generate CHANGELOG with sections and Keep a Changelog format ([d6cee6b](https://github.com/jlongyam/repo/commit/d6cee6b)) - _jlongyam_

### Changed

- refactor: Improve changelog generation and formatting ([b1a60ee](https://github.com/jlongyam/repo/commit/b1a60ee)) - _jlongyam_
- docs: Update README and CHANGELOG for v0.1.3 release ([4de5c01](https://github.com/jlongyam/repo/commit/4de5c01)) - _jlongyam_

### Fixed

- fix: Correct homepage URL in package.json ([e4ced6b](https://github.com/jlongyam/repo/commit/e4ced6b)) - _jlongyam_

## [0.1.3] - 2025-08-08

### Added

- feat: Add changelog generation with Keep a Changelog format ([ab8618f](https://github.com/jlongyam/repo/commit/ab8618f)) - _jlongyam_

### Changed

- refactor: Improve changelog generation ([afbac80](https://github.com/jlongyam/repo/commit/afbac80)) - _jlongyam_

## [0.1.2] - 2025-08-08

### Added

- feat: Improve changelog generation with version history support ([3da3f43](https://github.com/jlongyam/repo/commit/3da3f43)) - _jlongyam_

## [0.1.1] - 2025-08-08

### Added

- feat!: change authentication API ([3f2f9d9](https://github.com/jlongyam/repo/commit/3f2f9d9)) - _jlongyam_
- feat: Enhance changelog generation ([a92c151](https://github.com/jlongyam/repo/commit/a92c151)) - _jlongyam_
- feat: Add CHANGELOG.md to .gitignore ([6cc3be2](https://github.com/jlongyam/repo/commit/6cc3be2)) - _jlongyam_
- feat: Generate changelog using Keep a Changelog format ([26d5f99](https://github.com/jlongyam/repo/commit/26d5f99)) - _jlongyam_
- feat: ✨ added cool new feature ([0a11ff6](https://github.com/jlongyam/repo/commit/0a11ff6)) - _jlongyam_
- feat: initial commit and setup project ([288fd4d](https://github.com/jlongyam/repo/commit/288fd4d)) - _jlongyam_

### Changed

- docs: update README to clarify nextVersion and add references ([988a176](https://github.com/jlongyam/repo/commit/988a176)) - _jlongyam_
- docs: update README to include nextVersion in the feature list ([6055443](https://github.com/jlongyam/repo/commit/6055443)) - _jlongyam_
- refactor: hello ([5f0945f](https://github.com/jlongyam/repo/commit/5f0945f)) - _jlongyam_
- docs(-): add gitzy to scripts.commit ([befeae5](https://github.com/jlongyam/repo/commit/befeae5)) - _jlongyam_
- chore: 🤖 test gitzy ([7bef74c](https://github.com/jlongyam/repo/commit/7bef74c)) - _jlongyam_
- docs: test ([a387980](https://github.com/jlongyam/repo/commit/a387980)) - _jlongyam_

### Fixed

- fix: add cz commitizen ([e394604](https://github.com/jlongyam/repo/commit/e394604)) - _jlongyam_

[Unreleased]: https://github.com/jlongyam/repo/compare/v0.2.1...HEAD
[0.2.1]: https://github.com/jlongyam/repo/compare/v0.2.0...v0.2.1
[0.2.0]: https://github.com/jlongyam/repo/compare/v0.1.3...v0.2.0
[0.1.3]: https://github.com/jlongyam/repo/compare/v0.1.2...v0.1.3
[0.1.2]: https://github.com/jlongyam/repo/compare/v0.1.1...v0.1.2
[0.1.1]: https://github.com/jlongyam/repo/compare/vHEAD...v0.1.1
