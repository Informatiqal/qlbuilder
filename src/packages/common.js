import fs from "fs";
import chalk from "chalk";

export function writeFile(path, content) {
  return fs.writeFileSync(path, content);
}

export function writeLog(type, message, exit) {
  const symbol = {
    err: chalk.red("✖"),
    warn: chalk.yellow("\u26A0"),
    ok: chalk.green("√"),
    info: chalk.yellow("\u24D8"),
  };

  const logMessage = `${symbol[type]} ${message}`;

  console.log(logMessage);

  if (exit) {
    process.exit();
  }
}
