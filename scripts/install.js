// Create the required files and folders (if not exists)
import { existsSync, writeFileSync } from "fs";
import { homedir } from "os";

const homeDir = homedir();
const configPath = `${homeDir}/.qlBuilder.yml`;

function configYaml() {
  if (!existsSync(configPath)) {
    const yamlString = `winform:
  QLIK_USER: USER_DIR\\username
  QLIK_PASSWORD: password
certificates:
  QLIK_CERTS: C:\\path\\to\\certificates\\folder
  QLIK_USER: USER_DIR\\username
jwt_saas:
  QLIK_TOKEN: your.jwt-token.goes-here
  `;

    try {
      writeFileSync(`${homeDir}/.qlBuilder.yml`, yamlString);
    } catch (e) {}
  }
}

configYaml();
