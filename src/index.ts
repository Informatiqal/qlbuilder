import { Commander } from "./Commands";

const commands = new Commander();

commands.programs.parse(process.argv);

export default commands;
