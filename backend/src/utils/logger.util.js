'use strict';

/**
 * Minimal structured logger.
 * Uses console under the hood with ISO timestamps and log levels.
 * Swap for Winston / Pino in production as needed.
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel =
  LEVELS[process.env.LOG_LEVEL?.toLowerCase()] ??
  (process.env.NODE_ENV === 'production' ? LEVELS.info : LEVELS.debug);

function fmt(level, message, ...args) {
  const ts     = new Date().toISOString();
  const lvlStr = level.toUpperCase().padEnd(5);
  const extra  = args.length > 0 ? ' ' + args.map(String).join(' ') : '';
  return `[${ts}] ${lvlStr} ${message}${extra}`;
}

const logger = {
  error: (msg, ...args) => {
    if (currentLevel >= LEVELS.error)
      console.error(fmt('error', msg, ...args));
  },
  warn: (msg, ...args) => {
    if (currentLevel >= LEVELS.warn)
      console.warn(fmt('warn', msg, ...args));
  },
  info: (msg, ...args) => {
    if (currentLevel >= LEVELS.info)
      console.log(fmt('info', msg, ...args));
  },
  debug: (msg, ...args) => {
    if (currentLevel >= LEVELS.debug)
      console.log(fmt('debug', msg, ...args));
  },
};

module.exports = logger;
