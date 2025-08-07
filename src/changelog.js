import fs  from 'fs';
import { execSync } from 'child_process';
import semver from 'semver';

/**
 * Generates a CHANGELOG.md file following Keep a Changelog standards
 * @param {Object} options - Configuration options
 * @param {string} [options.outputFile='CHANGELOG.md'] - Output file path
 * @param {string} [options.repoUrl] - Repository URL to generate links
 * @param {boolean} [options.groupByType=true] - Group commits by conventional commit types
 * @param {boolean} [options.includeUnreleased=true] - Include an "Unreleased" section
 * @param {string} [options.latestVersion] - Explicitly set the latest version
 */
function generateKeepAChangelog(options = {}) {
  const {
    outputFile = './CHANGELOG.md',
    repoUrl,
    groupByType = true,
    includeUnreleased = true,
    latestVersion
  } = options;

  // 1. Get all git tags sorted by version
  const tags = getVersionTags();
  let versions = [...tags];
  
  // Determine latest version if not provided
  const currentVersion = latestVersion || (tags.length > 0 ? tags[0].version : '0.1.0');
  
  // 2. Get git log for each version range
  const changelogData = {
    unreleased: includeUnreleased ? getGitLogCommits('HEAD', tags[0]?.hash) : [],
    versions: []
  };

  for (let i = 0; i < tags.length; i++) {
    const from = tags[i + 1]?.hash || null;
    const to = tags[i].hash;
    changelogData.versions.push({
      version: tags[i].version,
      date: tags[i].date,
      commits: getGitLogCommits(from, to)
    });
  }

  // 3. Generate the changelog content following Keep a Changelog standards
  let changelog = `# Changelog\n\n` +
    `All notable changes to this project will be documented in this file.\n\n` +
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\n` +
    `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

  // Unreleased section
  if (includeUnreleased && changelogData.unreleased.length > 0) {
    changelog += `## [Unreleased]\n\n` +
      generateSectionContent(changelogData.unreleased, { repoUrl, groupByType }) +
      `\n`;
  }

  // Released versions
  for (const versionData of changelogData.versions) {
    changelog += `## [${versionData.version}] - ${versionData.date}\n\n` +
      generateSectionContent(versionData.commits, { repoUrl, groupByType }) +
      `\n`;
  }

  // Add links section if repoUrl is provided
  if (repoUrl) {
    changelog += `[Unreleased]: ${repoUrl}/compare/v${currentVersion}...HEAD\n`;
    for (let i = 0; i < tags.length; i++) {
      const prevTag = i < tags.length - 1 ? `v${tags[i + 1].version}` : 'HEAD';
      changelog += `[${tags[i].version}]: ${repoUrl}/compare/v${prevTag}...v${tags[i].version}\n`;
    }
  }

  // Write to file
  fs.writeFileSync(outputFile, changelog);
  console.log(`Successfully generated ${outputFile} following Keep a Changelog standards`);
}

// Helper functions

function getVersionTags() {
  const tagList = execSync('git tag --sort=-v:refname').toString().trim().split('\n');
  return tagList
    .map(tag => {
      const version = tag.replace(/^v/, '');
      return semver.valid(version) ? { version, hash: getTagHash(tag), date: getTagDate(tag) } : null;
    })
    .filter(Boolean)
    .sort((a, b) => semver.rcompare(a.version, b.version));
}

function getTagHash(tag) {
  return execSync(`git rev-list -n 1 ${tag}`).toString().trim();
}

function getTagDate(tag) {
  return execSync(`git log -1 --format=%ai ${tag}`).toString().trim().split(' ')[0];
}

function getGitLogCommits(from, to) {
  const range = from ? `${from}..${to}` : to || 'HEAD';
  const log = execSync(`git log --pretty=format:"%h|%s|%ad|%an" --date=short ${range}`)
    .toString()
    .trim();
  
  return log ? log.split('\n').map(line => {
    const [hash, message, date, author] = line.split('|');
    return { hash, message, date, author };
  }) : [];
}

function generateSectionContent(commits, options) {
  const { repoUrl, groupByType } = options;
  let content = '';

  if (groupByType) {
    const typeGroups = groupCommitsByType(commits);
    const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert', 'other'];
    
    for (const type of typeOrder) {
      if (typeGroups[type] && typeGroups[type].length > 0) {
        content += `### ${type.charAt(0).toUpperCase() + type.slice(1)}\n\n`;
        typeGroups[type].forEach(commit => {
          content += formatCommit(commit, repoUrl) + '\n';
        });
        content += '\n';
      }
    }
  } else {
    commits.forEach(commit => {
      content += formatCommit(commit, repoUrl) + '\n';
    });
    content += '\n';
  }

  return content;
}

function groupCommitsByType(commits) {
  const groups = {};
  
  commits.forEach(commit => {
    const match = commit.message.match(/^(\w+)(?:\(([^)]+)\))?:?\s?(.+)/i);
    let type = 'other';
    let message = commit.message;
    
    if (match) {
      type = match[1].toLowerCase();
      const scope = match[2];
      message = match[3].trim();
      
      if (scope) {
        message = `**${scope}:** ${message}`;
      }
    }
    
    if (!groups[type]) groups[type] = [];
    groups[type].push({ ...commit, message });
  });
  
  return groups;
}

function formatCommit(commit, repoUrl) {
  let message = `- ${commit.message}`;
  if (repoUrl) {
    message += ` ([${commit.hash.substring(0, 7)}](${repoUrl}/commit/${commit.hash}))`;
  }
  message += ` - _${commit.author}_`;
  return message;
}

// Example usage:
// generateKeepAChangelog({
//   repoUrl: 'https://github.com/username/repo',
//   includeUnreleased: true,
//   groupByType: true
// });

export {generateKeepAChangelog as changelog }