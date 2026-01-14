import chalk from 'chalk';

export class Logger {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.silent = options.silent || false;
    this.prefix = options.prefix || 'MR-Builder';
    this.useEmoji = options.emoji !== false;
  }

  setVerbose(verbose) {
    this.verbose = verbose;
  }

  setSilent(silent) {
    this.silent = silent;
  }

  #format(message, emoji = '') {
    const prefix = this.useEmoji ? `${emoji} ` : '';
    return `${chalk.blue(`[${this.prefix}]`)} ${prefix}${message}`;
  }

  info(message) {
    if (!this.silent) {
      // eslint-disable-next-line no-console
      console.log(this.#format(message, '📦'));
    }
  }

  success(message) {
    if (!this.silent) {
      // eslint-disable-next-line no-console
      console.log(chalk.green(this.#format(message, '√')));
    }
  }

  warn(message) {
    if (!this.silent) {
      // eslint-disable-next-line no-console
      console.log(chalk.yellow(this.#format(message, '‼')));
    }
  }

  error(message) {
    // eslint-disable-next-line no-console
    console.error(chalk.red(this.#format(message, '×')));
  }

  debug(message) {
    if (this.verbose && !this.silent) {
      // eslint-disable-next-line no-console
      console.log(chalk.gray(this.#format(`[debug] ${message}`)));
    }
  }

  progress(packageName, message, status = 'info') {
    if (this.silent) return;

    const colors = {
      info: chalk.cyan,
      success: chalk.green,
      warning: chalk.yellow,
      error: chalk.red,
    };

    const color = colors[status] || colors.info;
    const prefix = chalk.dim(`[${packageName}]`);
    // eslint-disable-next-line no-console
    console.log(color(`${prefix} ${message}`));
  }

  startTimer(label) {
    const start = process.hrtime.bigint();
    return {
      stop: () => {
        const end = process.hrtime.bigint();
        const duration = Number(end - start) / 1_000_000; // Convert to milliseconds
        this.debug(`${label} took ${duration.toFixed(2)}ms`);
        return duration;
      }
    };
  }
}

export default Logger;