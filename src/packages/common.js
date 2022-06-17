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

export function uuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateXrfkey() {
  var chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  var string_length = 16;
  var value = "";
  for (var i = 0; i < string_length; i++) {
    var rNum = Math.floor(Math.random() * chars.length);
    value += chars.substring(rNum, rNum + 1);
  }
  return value;
}
