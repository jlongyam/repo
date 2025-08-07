import fs from 'fs/promises';
import { execSync } from 'child_process';
import semver from 'semver';

/**
 * Generates or updates a CHANGELOG.md file following Keep a Changelog standards
 * @param {Object} options - Configuration options
 * @param {string} [options.outputFile='CHANGELOG.md'] - Output file path
 * @param {string} [options.repoUrl] - Repository URL to generate links
 * @param {boolean} [options.groupByType=true] - Group commits by conventional commit types
 * @param {boolean} [options.includeUnreleased=true] - Include an "Unreleased" section
 * @param {string} [options.latestVersion] - Explicitly set the latest version
 * @param {boolean} [options.append=true] - Append to existing changelog if it exists
 */
export async function generateKeepAChangelog(options = {}) {
  const {
    outputFile = 'CHANGELOG.md',
    repoUrl,
    groupByType = true,
    includeUnreleased = true,
    latestVersion,
    append = true
  } = options;

  try {
    // 1. Get all version tags
    const tags = await getVersionTags();
    console.log(`Found tags: ${tags.map(t => t.version).join(', ')}`);

    // 2. Get existing content if append mode
    let existingContent = '';
    if (append) {
      try {
        existingContent = await fs.readFile(outputFile, 'utf8');
      } catch (error) {
        if (error.code !== 'ENOENT') throw error;
      }
    }

    // 3. Determine current version
    const currentVersion = latestVersion || (tags[0]?.version || '0.1.0');
    console.log(`Current version: ${currentVersion}`);

    // 4. Generate new content
    const changelogData = {
      unreleased: includeUnreleased ? await getNewCommits(tags[0]?.hash, existingContent) : [],
      versions: []
    };

    // Populate version history
    for (let i = 0; i < tags.length; i++) {
      const from = tags[i + 1]?.hash;
      const to = tags[i].hash;
      changelogData.versions.push({
        version: tags[i].version,
        date: tags[i].date,
        commits: await getGitLogCommits(from, to)
      });
    }

    // 5. Generate complete changelog
    const changelogContent = generateCompleteChangelog(changelogData, {
      repoUrl,
      groupByType,
      currentVersion,
      tags
    });

    // 6. Write to file
    await fs.writeFile(outputFile, changelogContent);
    console.log(`✅ Successfully generated ${outputFile} with versions`);
    return true;
  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}
async function getVersionTags() {
  try {
    const tagList = execSync('git tag -l --sort=-creatordate')
      .toString()
      .trim()
      .split('\n')
      .filter(Boolean);

    console.log("Raw tags:", tagList);  // Debug output

    const validTags = [];
    for (const tag of tagList) {
      // More flexible version parsing
      const versionMatch = tag.match(/v?(\d+\.\d+\.\d+)/);
      if (versionMatch) {
        validTags.push({
          originalTag: tag,
          version: versionMatch[1],  // Gets 0.1.1 from v0.1.1
          hash: await getTagHash(tag),
          date: await getTagDate(tag)
        });
      }
    }

    return validTags.sort((a, b) => semver.rcompare(a.version, b.version));
  } catch (error) {
    console.error("Tag detection failed:", error);
    return [];
  }
}

function mergeChangelogContent(existingContent, newContent) {
  // Find the position of the first version header
  const versionHeaderIndex = existingContent.indexOf('\n## [');

  if (versionHeaderIndex === -1) {
    // No version found, append at the end
    return `${existingContent}\n\n${newContent}`;
  }

  // Insert new content after the header but before the first version
  return (
    existingContent.slice(0, versionHeaderIndex) +
    '\n' + newContent + '\n' +
    existingContent.slice(versionHeaderIndex)
  );
}

async function getTagHash(tag) {
  return execSync(`git rev-list -n 1 ${tag}`).toString().trim();
}

async function getTagDate(tag) {
  return execSync(`git log -1 --format=%ai ${tag}`).toString().trim().split(' ')[0];
}

async function getGitLogCommits(from, to) {
  try {
    const range = from ? `${from}..${to || 'HEAD'}` : (to || 'HEAD');
    const log = execSync(`git log --pretty=format:"%h|%s|%ad|%an" --date=short ${range}`)
      .toString()
      .trim();

    return log ? log.split('\n').map(line => {
      const [hash, message, date, author] = line.split('|');
      return { hash, message, date, author };
    }) : [];
  } catch (error) {
    console.warn(`Warning: No commits found for range ${from}..${to}`);
    return [];
  }
}

function generateNewChangelogContent(commits, options) {
  const { repoUrl, groupByType } = options;

  let content = '## [Unreleased]\n\n' +
    generateSectionContent(commits, { repoUrl, groupByType });

  return content;
}

function generateFullChangelogContent(commits, options) {
  const { repoUrl, groupByType, currentVersion, tags } = options;

  let changelog = `# Changelog\n\n` +
    `All notable changes to this project will be documented in this file.\n\n` +
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),\n` +
    `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

  changelog += generateNewChangelogContent(commits, options);

  // Add links section if repoUrl is provided
  if (repoUrl) {
    changelog += generateComparisonLinks(currentVersion, tags, repoUrl);
  }

  return changelog;
}

function generateSectionContent(commits, options) {
  const { repoUrl, groupByType } = options;
  let content = '';

  if (groupByType) {
    const typeGroups = groupCommitsByType(commits);
    const typeOrder = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert', 'other'];

    for (const type of typeOrder) {
      if (typeGroups[type]?.length > 0) {
        content += `### ${mapTypeToSection(type)}\n\n`;
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

function mapTypeToSection(type) {
  const typeMap = {
    feat: 'Added',
    fix: 'Fixed',
    perf: 'Changed',
    refactor: 'Changed',
    docs: 'Changed',
    test: 'Changed',
    build: 'Changed',
    ci: 'Changed',
    chore: 'Changed',
    revert: 'Removed',
    other: 'Other'
  };
  return typeMap[type] || type;
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

function generateComparisonLinks(currentVersion, tags, repoUrl) {
  let links = '';

  if (tags.length === 0) {
    links = `[unreleased]: ${repoUrl}/compare/v${currentVersion}...HEAD\n`;
  } else {
    links = `[unreleased]: ${repoUrl}/compare/v${currentVersion}...HEAD\n`;
    for (let i = 0; i < tags.length; i++) {
      const prevTag = i < tags.length - 1 ? `v${tags[i + 1].version}` : 'HEAD';
      links += `[${tags[i].version}]: ${repoUrl}/compare/${prevTag}...v${tags[i].version}\n`;
    }
  }

  return links;
}