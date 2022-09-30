// Create the required files and folders (if not exists)
import { existsSync, fstat, mkdir, mkdirSync, writeFileSync } from "fs";
import { homedir } from "os";

const homeDir = homedir();
const configPath = `${homeDir}/.qlBuilder.yml`;
const templatesPath = `${homeDir}/qlBuilder_templates`;

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

  if (!existsSync(templatesPath)) {
    mkdirSync(templatesPath);
    mkdirSync(`${templatesPath}/config`);
    mkdirSync(`${templatesPath}/script`);
  }
}

configYaml();
