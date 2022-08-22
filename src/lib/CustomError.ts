import { Chalk } from "chalk";
import { Print } from "../lib/Print";

const chalk = new Chalk();

type MessageType = "error" | "warning" | "ok" | "info";

// const symbol = {
//   error: chalk.red("✖"),
//   warning: chalk.yellow("\u26A0"),
//   ok: chalk.green("√"),
//   info: chalk.yellow("\u24D8"),
// };

export class CustomError extends Error {
  print = new Print();
  constructor(message: string, type: MessageType, terminate?: boolean) {
    super();

    this.print.error(message);

    if (terminate && terminate == true) process.exit(1);
  }
}
