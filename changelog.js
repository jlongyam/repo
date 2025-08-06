const CHANGES = {
  Added: 'for new features.',
  Changed:  'for changes in existing functionality.',
  Deprecated: 'for soon-to-be removed features.',
  Removed: 'for now removed features.',
  Fixed: 'for any bug fixes.',
  Security: 'in case of vulnerabilities.'
}
var Changelog = require('generate-changelog');
var Fs        = require('fs');
/**
 * Generate the changelog.
 * @param {Object} options - generation options
 * @param {Boolean} options.patch - whether it should be a patch changelog
 * @param {Boolean} options.minor - whether it should be a minor changelog
 * @param {Boolean} options.major - whether it should be a major changelog
 * @param {String} options.repoUrl - repo URL that will be used when linking commits
 * @param {Array} options.exclude - exclude listed commit types (e.g. ['chore', 'style', 'refactor'])
 * @returns {Promise<String>} the \n separated changelog string
 */
//fs.appendFileSync()
return Changelog.generate({}).then(function (changelog) {
  Fs.writeFileSync('./default.md', changelog);
});