import { Commander } from "./Commands.js";

const commands = new Commander();

(async function () {
  await commands.loadPlugins();
  commands.programs.parse(process.argv);
})();

export default commands;
