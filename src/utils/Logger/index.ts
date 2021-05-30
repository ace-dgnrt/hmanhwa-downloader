import chalk from "chalk";

export class Logger {
  static _isDebugEnabled = false;
  static _isWarningsEnabled = true;
  static _isLoggingEnabled = true;
  static _isFileLoggingEnabled = true;
  static fileLoggingPath = ".";

  static get isDebugEnabled() {
    return Logger._isDebugEnabled && Logger._isLoggingEnabled;
  }

  static get isWarningEnabled() {
    return Logger._isWarningsEnabled && Logger._isLoggingEnabled;
  }

  private static printTable(data: any) {
    console.group("Data:");
    console.table(data);
    console.groupEnd();
  }

  static info(message: string, data?: any) {
    console.log(chalk.green.bold("Info: ") + chalk.white.bold(message));
    if (data) {
      Logger.printTable(data);
    }
  }

  static debug(message: string, data?: any) {
    if (!Logger.isDebugEnabled) {
      return;
    }
    console.debug(chalk.yellow.bold("Debug: ") + message);
    console.debug(chalk.italic("Debug message called from:"));
    console.trace("Debug message called from:");
    if (data) {
      Logger.printTable(data);
    }
  }

  static warning(message: string, data?: any) {
    if (!Logger.isWarningEnabled) {
      return;
    }
    console.warn(chalk.redBright.bold("Warning: ") + chalk.red(message));
    console.debug(chalk.italic("Warning message called from:"));
    console.trace();
    if (data) {
      Logger.printTable(data);
    }
  }
}
