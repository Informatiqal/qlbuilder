import { Chalk } from "chalk";

export class Print {
  chalk = new Chalk();
  ok(message: string) {
    console.log(`\n${this.chalk.green("√")} ${message}`);
  }

  error(message: string) {
    console.error(`\n${this.chalk.red("✖")} ${message}`);
  }

  info(message: string) {
    console.log(`\n${this.chalk.yellow("\u24D8")} ${message}`);
  }

  warn(message: string) {
    console.log(`\n${this.chalk.yellow("\u26A0")} ${message}`);
  }

  plain(message: string) {
    console.log(message);
  }
}
