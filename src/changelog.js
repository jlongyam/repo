import fs from 'fs/promises';
import { execSync } from 'child_process';
import semver from 'semver';

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

// Improved tag detection
async function getVersionTags() {
  try {
    const tagList = execSync('git tag -l --sort=-v:refname').toString().trim().split('\n');
    const validTags = [];
    
    for (const tag of tagList) {
      // Handle both v1.0.0 and 1.0.0 formats
      const version = tag.startsWith('v') ? tag.substring(1) : tag;
      if (semver.valid(version)) {
        validTags.push({
          originalTag: tag,
          version,
          hash: await getTagHash(tag),
          date: await getTagDate(tag)
        });
      }
    }
    
    return validTags.sort((a, b) => semver.rcompare(a.version, b.version));
  } catch (error) {
    console.warn('⚠️ No version tags found - using default versioning');
    return [];
  }
}

// Rest of the helper functions remain the same as previous solution
// (getTagHash, getTagDate, getGitLogCommits, generateSectionContent, etc.)