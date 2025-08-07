/**
 * Generates a conventional commit message
 * @param {Object} options - Commit message options
 * @param {string} options.type - Commit type (feat, fix, docs, style, refactor, test, chore, etc.)
 * @param {string} options.content - Commit description
 * @param {string} [options.scope] - Optional scope (e.g., component name)
 * @param {boolean} [options.breaking] - Whether this is a breaking change
 * @param {string} [options.body] - Optional detailed commit body
 * @param {string} [options.footer] - Optional footer (e.g., issue references)
 * @returns {string} Formatted conventional commit message
 */
function commit({ type, content, scope, breaking, body, footer }) {
  // Validate required parameters
  if (!type || !content) {
    throw new Error('Both type and content are required');
  }

  // Common conventional commit types
  const conventionalTypes = [
    'feat', 'fix', 'docs', 'style', 'refactor',
    'test', 'chore', 'perf', 'build', 'ci', 'revert'
  ];

  // Warn if using non-standard type (but don't enforce)
  if (!conventionalTypes.includes(type)) {
    console.warn(`Warning: "${type}" is not a conventional commit type. Consider using one of: ${conventionalTypes.join(', ')}`);
  }

  // Build the commit message
  let message = type;

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
}

export default commit;