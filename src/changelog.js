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
    .filter(tag => semver.valid(tag.replace(/^v/, '')))
    .map(tag => tag.trim());

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

// Helper: Format a single commit line
function formatCommit(commit, repoUrl) {
  let line = `- ${commit.message}`;
  if (repoUrl) {
    line += ` ([${commit.hash.slice(0, 7)}](${repoUrl}/commit/${commit.hash}))`;
  }
  if (commit.author) {
    line += ` - _${commit.author}_`;
  }
  return line;
}

// Helper: Group commits by type and format them
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
    const type = commit.message.match(/^(\w+)/)?.[1]?.toLowerCase() || 'other';
    const category = typeMap[type] || 'Other';
    if (!grouped[category]) grouped[category] = [];
    grouped[category].push(formatCommit(commit, repoUrl));
  });

  let result = '';
  // Standard Keep a Changelog categories in order
  const categories = ['Added', 'Changed', 'Deprecated', 'Removed', 'Fixed', 'Security'];
  categories.forEach(category => {
    if (grouped[category]) {
      result += `### ${category}\n${grouped[category].join('\n')}\n\n`;
    }
  });

  return result;
}

// Helper: Generate complete changelog content
function generateChangelogContent(data, repoUrl) {
  let changelog = `# Changelog\n\n` +
    `All notable changes to this project will be documented in this file.\n\n` +
    `The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),\n` +
    `and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).\n\n`;

  // Unreleased section
  if (data.unreleased.length > 0) {
    changelog += `## [Unreleased]\n\n` +
      `${formatCommitsByType(data.unreleased, repoUrl)}\n`;
  }

  // Released versions
  data.versions.forEach(version => {
    changelog += `## [${version.version}] - ${version.date}\n\n` +
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

  return changelog;
}

// Example usage:
// generateChangelog({ repoUrl: 'https://github.com/your/repo' });