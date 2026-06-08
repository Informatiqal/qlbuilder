import { Commander } from "./Commands.js";

const commands = new Commander();

commands.programs.parse(process.argv);

export default commands;
