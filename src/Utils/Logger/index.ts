import chalk from "chalk";

export class Logger {
  static _isDebugEnabled = true;
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
    console.log(data);
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
    console.debug(chalk.blueBright.bold("Debug: ") + message);
    console.trace(chalk.italic("Debug message called from:"));
    if (data) {
      Logger.printTable(data);
    }
  }

  static warning(message: string, data?: any) {
    if (!Logger.isWarningEnabled) {
      return;
    }
    console.warn(chalk.yellow.bold("Warning: ") + chalk.white(message));
    console.trace(chalk.italic("Warning message called from:"));
    if (data) {
      Logger.printTable(data);
    }
  }

  static error(message: string, data?: any) {
    console.error(chalk.redBright.bold("Error: ") + chalk.white(message));
    console.trace(chalk.italic("Error message called from:"));
    if (data) {
      Logger.printTable(data);
    }
  }
}
