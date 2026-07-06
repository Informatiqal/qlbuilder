import { Chalk } from "chalk";

export class Print {
  messageStart: string = "\n";
  constructor(startWithNewLine?: boolean) {
    if (!startWithNewLine) this.messageStart = "";
  }
  chalk = new Chalk();
  ok(message: string) {
    console.log(`${this.messageStart}${this.chalk.green("√")} ${message}`);
  }

  error(message: string) {
    console.error(`${this.messageStart}${this.chalk.red("✖")} ${message}`);
  }

  info(message: string) {
    console.log(
      `${this.messageStart}${this.chalk.yellow("\u24D8")} ${message}`,
    );
  }

  warn(message: string) {
    console.log(
      `${this.messageStart}${this.chalk.yellow("\u26A0")} ${message}`,
    );
  }

  plain(message: string) {
    console.log(message);
  }
}
