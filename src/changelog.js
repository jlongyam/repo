import fs from 'fs/promises';
import { execSync } from 'child_process';
import semver from 'semver';

/**
 * Generate or update CHANGELOG.md
 * @param {Object} options
 * @param {string} options.repoUrl - GitHub repo URL (e.g., "https://github.com/user/repo")
 */
export async function generateChangelog(options = {}) {
  const { repoUrl } = options;

  try {
    // 1. Get all version tags
    const tags = await getVersionTags();
    console.log(`Found tags: ${tags.map(t => t.version).join(', ')}`);

    // 2. Get commits for each version range
    const changelogData = {
      unreleased: await getGitLogCommits(tags[0]?.hash, 'HEAD'), // Unreleased commits
      versions: []
    };

    // Add commits for each tagged version
    for (let i = 0; i < tags.length; i++) {
      const from = tags[i + 1]?.hash;
      const to = tags[i].hash;
      changelogData.versions.push({
        version: tags[i].version,
        date: tags[i].date,
        commits: await getGitLogCommits(from, to)
      });
    }

    // 3. Generate the changelog content
    const changelogContent = generateChangelogContent(changelogData, repoUrl);

    // 4. Write to file
    await fs.writeFile('CHANGELOG.md', changelogContent);
    console.log('✅ CHANGELOG.md generated successfully!');
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

// Helper: Generate Markdown content
function generateChangelogContent(data, repoUrl) {
  let changelog = `# Changelog\n\n` +
    `All notable changes will be documented here.\n\n` +
    `Generated using [Keep a Changelog](https://keepachangelog.com).\n\n`;

  // Unreleased section
  if (data.unreleased.length > 0) {
    changelog += `## [Unreleased]\n\n`;
    data.unreleased.forEach(commit => {
      changelog += `- ${formatCommit(commit, repoUrl)}\n`;
    });
    changelog += '\n';
  }

  // Released versions
  data.versions.forEach(version => {
    changelog += `## [${version.version}] - ${version.date}\n\n`;
    version.commits.forEach(commit => {
      changelog += `- ${formatCommit(commit, repoUrl)}\n`;
    });
    changelog += '\n';
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

// Helper: Format a single commit line
function formatCommit(commit, repoUrl) {
  let line = commit.message;
  if (repoUrl) {
    line += ` ([${commit.hash.slice(0, 7)}](${repoUrl}/commit/${commit.hash}))`;
  }
  return line;
}

// Example usage
// generateChangelog({ repoUrl: 'https://github.com/your/repo' });