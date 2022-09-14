// Create the required files and folders (if not exists)
import { unlink, existsSync } from "fs";
import { homedir } from "os";

const homeDir = homedir();
const configPath = `${homeDir}/.qlBuilder.yml`;

function configYaml() {
  if (existsSync(configPath)) {
    try {
      unlink(`${homeDir}/.qlBuilder.yml`, yamlString);
    } catch (e) {}
  }
}

configYaml();
