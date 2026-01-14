# Repo

CLI tool to manage repository:

- commit - [conventionalcommits]((https://www.conventionalcommits.org/en/v1.0.0/))
- changelog - [keepachangelog](https://keepachangelog.com/en/1.1.0/)
- version - [semver](https://semver.org/)

## Structure

```text
repo/
├── packages/
│   ├── ui/
│   ├── utils/
│   └── api/
├── src/
│   ├── cli/
│   │   └── index.js
│   ├── commands/
│   │   ├── build.js
│   │   ├── clean.js
│   │   ├── watch.js
│   │   └── deps.js
│   ├── core/
│   │   └── builder.js
│   ├── utils/
│   │   ├── config.js
│   │   ├── graph.js
│   │   └── logger.js
│   └── index.js
├── bin/
│   └── repo.js
├── package.json
├── monorepo-builder.config.js
└── README.md
```

## Usage Examples

```shell
# Install globally
cd ..
npm i -g ./repo
# Uninstall
npm un -g @jlongyam/repo

# Or link for development (recomended)
cd repo
npm link
# Uninstall
npm unlink -g @jlongyam/repo

# Build all packages
repo build --all

# Build specific packages
repo build -p ui api --verbose

# Clean packages
repo clean --all

# Watch packages
repo watch -p ui

# Show dependencies
repo deps --tree
repo deps --json
repo deps --visual

# Build in parallel
repo build --all --parallel --max-parallel 8
```
