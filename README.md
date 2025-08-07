# repo

Script tool to manage repository

- commit - convesional
- nextVersion - semantic (TODO)
- changelog - keep

```
# First create a version tag if none exist
git tag v1.0.0
git push --tags

# Then run the generator
node --experimental-modules generate-changelog.js
```

### References


- https://www.conventionalcommits.org/en/v1.0.0/
- semver
- https://keepachangelog.com/en/1.1.0/

### See also

- AI tool: GemCommit