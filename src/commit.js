import { execSync } from 'child_process';

/**
 * Generates a conventional commit message with proper error handling
 * @param {Object} options - Commit message options
 * @returns {string} Formatted conventional commit message
 */
function commit(options) {
  // Show help if no arguments or help requested
  if (!options || options.help) {
    return showHelp();
  }

  try {
    // Destructure with defaults
    const {
      type = '',
      content = '',
      scope = '',
      breaking = false,
      body = '',
      footer = ''
    } = options;

    // Validate required parameters
    if (!type.trim()) {
      throw new Error('Commit type is required');
    }
    if (!content.trim()) {
      throw new Error('Commit content/description is required');
    }

    // Common conventional commit types
    const conventionalTypes = [
      'feat', 'fix', 'docs', 'style', 'refactor', 
      'test', 'chore', 'perf', 'build', 'ci', 'revert'
    ];

    // Validate type (case insensitive)
    const normalizedType = type.toLowerCase();
    if (!conventionalTypes.includes(normalizedType)) {
      console.warn(`Warning: "${type}" is not a conventional commit type. Consider using one of:\n${conventionalTypes.join(', ')}`);
    }

    // Validate scope format if provided
    if (scope && !/^[a-z0-9-]+$/i.test(scope)) {
      throw new Error('Scope should be alphanumeric with optional hyphens');
    }

    // Build the commit message
    let message = normalizedType;
    
    // Add scope if provided
    if (scope) {
      message += `(${scope})`;
    }
    
    // Add breaking change indicator
    if (breaking) {
      message += '!';
    }
    
    // Add the main content
    message += `: ${content.trim()}`;
    
    // Add body if provided
    if (body) {
      message += `\n\n${body.trim()}`;
    }
    
    // Add footer if provided
    if (footer) {
      message += `\n\n${footer.trim()}`;
    }
    
    // Add breaking change explanation if marked as breaking but no footer
    if (breaking && !footer) {
      message += `\n\nBREAKING CHANGE: ${content}`;
    } else if (breaking) {
      // If footer exists, prepend BREAKING CHANGE to it
      message = message.replace(footer, `BREAKING CHANGE: ${content}\n\n${footer}`);
    }

    return message;

  } catch (error) {
    // Handle specific error cases
    if (error instanceof TypeError) {
      console.error('Error: Invalid options format. Expected an object.');
      return showHelp();
    } else {
      console.error(`Error: ${error.message}`);
      return showHelp();
    }
  }
}

/**
 * Creates an actual Git commit using the conventional commit message
 * @param {Object} options - Same options as commit()
 * @param {boolean} [options.dryRun] - If true, just returns the message without committing
 * @param {boolean} [options.addAll] - If true, runs 'git add .' before committing
 */
function gitCommit(options = {}) {
  try {
    // Handle help request
    if (options.help) {
      console.log(showHelp());
      return;
    }

    // Generate the commit message
    const message = commit(options);
    
    // Dry run mode - just show what would be committed
    if (options.dryRun) {
      console.log('Dry run - would commit with message:\n');
      console.log(message);
      console.log('\nAdd --no-dry-run to actually commit');
      return;
    }

    // Stage all files if requested
    if (options.addAll) {
      console.log('Staging all files...');
      execSync('git add .', { stdio: 'inherit' });
    }

    // Create the commit
    console.log('Creating commit...');
    execSync(`git commit -m "${message.replace(/"/g, '\\"')}"`, { stdio: 'inherit' });

    console.log('Commit created successfully!');

  } catch (error) {
    console.error('Error creating commit:', error.message);
    
    // If it's a Git error, show more context
    if (error.stderr) {
      console.error(error.stderr.toString());
    }
  }
}

/**
 * Displays help message with usage examples
 * @returns {string} Help message
 */
function showHelp() {
  return `
Conventional Commit Message Generator
Usage: commit({ type: string, content: string [, options] })

Required:
  type      Commit type (feat, fix, docs, style, refactor, test, chore, etc.)
  content   Commit description (what changed)

Optional:
  scope     Scope of changes (e.g., component name)
  breaking  Boolean indicating breaking changes
  body      Detailed explanation of changes
  footer    Footer information (e.g., issue references)
  help      Show this help message

Examples:
  // Basic feature
  commit({
    type: 'feat',
    content: 'add user profile page'
  });

  // Fix with scope
  commit({
    type: 'fix',
    scope: 'parser',
    content: 'handle null values in template'
  });

  // Breaking change
  commit({
    type: 'feat',
    content: 'change authentication method',
    breaking: true,
    body: 'Migrated from JWT to session cookies',
    footer: 'Closes #123'
  });

Conventional Types:
  feat      A new feature
  fix       A bug fix
  docs      Documentation changes
  style     Code style/formatting
  refactor  Code change that neither fixes nor adds a feature
  test      Adding missing tests
  chore     Maintenance tasks
  perf      Performance improvement
  build     Build system changes
  ci        CI configuration changes
  revert    Reverts a previous commit
`;
}

// Example error cases:
// console.log(commit()); // Shows help
// console.log(commit({ help: true })); // Shows help
// console.log(commit({ type: 'feat' })); // Error: missing content
// console.log(commit({ content: 'some change' })); // Error: missing type
// console.log(commit({ type: 'feature', content: 'invalid type' })); // Warning

export { commit, gitCommit };