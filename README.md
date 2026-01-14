# Repo

CLI tool to manage repository:

- commit - [conventionalcommits]((https://www.conventionalcommits.org/en/v1.0.0/))
- changelog - [keepachangelog](https://keepachangelog.com/en/1.1.0/)
- version - [semver](https://semver.org/)

```text
monorepo-builder-cli/
├── packages/
│   ├── ui/
│   │   ├── package.json
│   │   └── src/
│   ├── utils/
│   │   ├── package.json
│   │   └── src/
│   └── api/
│       ├── package.json
│       └── src/
├── package.json
├── bin/
│   └── mr-builder.js
└── lib/
    ├── commands/
    │   ├── build.js
    │   ├── clean.js
    │   ├── watch.js
    │   └── deps.js
    ├── utils/
    │   ├── config.js
    │   ├── graph.js
    │   └── logger.js
    └── core/
        └── builder.js
```
