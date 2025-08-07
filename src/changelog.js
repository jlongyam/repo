import fs from 'fs/promises';
import { execSync } from 'child_process';
import semver from 'semver';

export async function generateChangelog(options = {}) {
  const { repoUrl } = options;

  try {
    // 1. Get all version tags
    const tags = await getVersionTags();
    console.log(`Found tags: ${tags.map(t => t.version).join(', ')}`);

    // 2. Get commits for each version range
    const changelogData = {
      unreleased: await getGitLogCommits(tags[0]?.hash, 'HEAD'),
      versions: []
    };

    for (let i = 0; i < tags.length; i++) {
      const from = tags[i + 1]?.hash;
      const to = tags[i].hash;
      changelogData.versions.push({
        version: tags[i].version,
        date: tags[i].date,
        commits: await getGitLogCommits(from, to)
      });
    }

    // 3. Generate the changelog content with proper sections
    const changelogContent = generateChangelogContent(changelogData, repoUrl);

    // 4. Write to file
    await fs.writeFile('CHANGELOG.md', changelogContent);
    console.log('✅ CHANGELOG.md generated with proper sections!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}


// Helper: Get all version tags (sorted newest first)
async function getVersionTags() {
  const tags = execSync('git tag -l --sort=-v:refname')
    .toString()
    .trim()
    .split('\n')
    .filter(tag => semver.valid(tag.replace(/^v/, '')));

  return Promise.all(
    tags.map(async tag => {
      const version = tag.replace(/^v/, '');
      return {
        version,
        hash: await getTagHash(tag),
        date: await getTagDate(tag)
      };
    })
  );
}

// Helper: Get commit hash for a tag
async function getTagHash(tag) {
  return execSync(`git rev-list -n 1 ${tag}`).toString().trim();
}

// Helper: Get date for a tag (YYYY-MM-DD)
async function getTagDate(tag) {
  return execSync(`git log -1 --format=%ai ${tag}`)
    .toString()
    .trim()
    .split(' ')[0];
}

// Helper: Get commits between two refs (from..to)
async function getGitLogCommits(from, to) {
  const range = from ? `${from}..${to}` : to || 'HEAD';
  const log = execSync(
    `git log --pretty=format:"%h|%s|%ad|%an" --date=short ${range}`
  )
    .toString()
    .trim();

  return log
    ? log.split('\n').map(line => {
        const [hash, message, date, author] = line.split('|');
        return { hash, message, date, author };
      })
    : [];
}

function generateChangelogContent(data, repoUrl) {
  let changelog = `# Changelog\n\n` +
    `All notable changes to this project will be documented in this file.\n\n` +
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n` +
    `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

  // Unreleased section with headers
  if (data.unreleased.length > 0) {
    changelog += `## [Unreleased]\n\n` +
      `### Added\n### Changed\n### Deprecated\n### Removed\n### Fixed\n### Security\n\n` +
      `${formatCommitsByType(data.unreleased, repoUrl)}\n`;
  }

  // Released versions with headers
  data.versions.forEach(version => {
    changelog += `## [${version.version}] - ${version.date}\n\n` +
      `### Added\n### Changed\n### Deprecated\n### Removed\n### Fixed\n### Security\n\n` +
      `${formatCommitsByType(version.commits, repoUrl)}\n`;
  });

  // Version comparison links
  if (repoUrl) {
    changelog += `[Unreleased]: ${repoUrl}/compare/v${data.versions[0]?.version || '0.1.0'}...HEAD\n`;
    data.versions.forEach((version, i) => {
      const prev = data.versions[i + 1]?.version || 'HEAD';
      changelog += `[${version.version}]: ${repoUrl}/compare/v${prev}...v${version.version}\n`;
    });
  }

  // Add Keep a Changelog reference at the bottom
  changelog += `\n\n## Keep a Changelog Format\n\n` +
    `- \`Added\` for new features.\n` +
    `- \`Changed\` for changes in existing functionality.\n` +
    `- \`Deprecated\` for soon-to-be removed features.\n` +
    `- \`Removed\` for now removed features.\n` +
    `- \`Fixed\` for any bug fixes.\n` +
    `- \`Security\` in case of vulnerabilities.`;

  return changelog;
}

// Group commits by type (feat -> Added, fix -> Fixed, etc.)
function formatCommitsByType(commits, repoUrl) {
  const typeMap = {
    feat: 'Added',
    fix: 'Fixed',
    perf: 'Changed',
    refactor: 'Changed',
    docs: 'Changed',
    test: 'Changed',
    chore: 'Changed',
    revert: 'Removed'
  };

  const grouped = {};
  commits.forEach(commit => {
    const type = commit.message.match(/^(\w+)/)?.[1] || 'other';
    const category = typeMap[type] || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(formatCommit(commit, repoUrl));
  });

  let result = '';
  Object.entries(grouped).forEach(([category, items]) => {
    result += `#### ${category}\n${items.join('\n')}\n\n`;
  });

  return result;
}


// Example usage
// generateChangelog({ repoUrl: 'https://github.com/your/repo' });