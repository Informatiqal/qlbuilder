const fs = require('fs');
const yaml = require('js-yaml');
const homedir = require('os').homedir();
const chalk = require('chalk');
const common = require('./common');

function getEnvDetails(env) {

    let config = loadConfig()
    if (config.error) return config
    if (config.message.length == 0) return { error: true, message: `No environments found in the config file` }

    try {
        let envDetails = config.message.filter(confEnv => confEnv.name == env);

        if (envDetails.length == 0) return { error: true, message: `The specified environment (${env}) do not exists in the config` }
        if (envDetails.length > 1) return { error: true, message: `Multiple environments with the same name - ${env}` }

        if (!envDetails[0].hasOwnProperty('secure')) envDetails[0].secure = true
        envDetails[0].engineHost = `${envDetails[0].secure ? 'wss' : 'ws'}://${envDetails[0].host}`
        envDetails[0].host = `${envDetails[0].secure ? 'https' : 'http'}://${envDetails[0].host}`

        if (envDetails[0].hasOwnProperty('trustAllCerts')) {
            if (envDetails[0].trustAllCerts) {
                process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
            }
        }

        return { error: false, message: envDetails }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

function loadConfig() {
    try {
        let config = yaml.safeLoad(fs.readFileSync(`${process.cwd()}/config.yml`))

        return { error: false, message: config }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const initialChecks = {
    configFileExists: function () {
        if (!fs.existsSync(`${process.cwd()}/config.yml`)) {
            return { error: true, message: `"config.yml" do not exists! I'm running at the correct folder?` }
        }

        return { error: false, message: 'config.yml was found' }
    },
    srcFolderExists: function () {
        if (!fs.existsSync(`${process.cwd()}/src`)) {
            return { error: true, message: `config is present but "src" folder was not` }
        }

        return { error: false, message: '"src" folder was found' }
    },
    distFolderExists: function () {
        if (!fs.existsSync(`${process.cwd()}/dist`)) {
            return { error: true, message: `config is present but "dist" folder was not` }
        }

        return { error: false, message: '"dist" folder was found' }
    },
    environmentExists: function (env) {
        let envDetails = getEnvDetails(env)
        if (envDetails.error) return envDetails

        return { error: false, message: envDetails.message[0] }
    },
    environmentVariables: function (env) {
        let allEnvVariables = envVariablesCheck.combined(env)
        if (allEnvVariables.error) return allEnvVariables

        return { error: false, message: allEnvVariables.message }
    },
    combined: function (envName) {
        let configFile = initialChecks.configFileExists()
        if (configFile.error) return configFile

        let srcFolderExists = initialChecks.srcFolderExists()
        if (srcFolderExists.error) return srcFolderExists

        let distFolderExists = initialChecks.distFolderExists()
        if (distFolderExists.error) return distFolderExists

        let envDetails = initialChecks.environmentExists(envName)
        if (envDetails.error) return envDetails

        // if the required variables are set
        // or specified in .qlbuilder file
        let envVariables = initialChecks.environmentVariables(envDetails.message)
        if (envVariables.error) return envVariables

        return { error: false, message: { env: envDetails.message, variables: envVariables.message } }
    },
    short: function () {
        let srcFolderExists = initialChecks.srcFolderExists()
        if (srcFolderExists.error) return srcFolderExists

        let distFolderExists = initialChecks.distFolderExists()
        if (distFolderExists.error) return distFolderExists

        return { error: false, message: 'SRC and DIST folders exists' }
    }
}

const envVariablesCheck = {
    auth_config: {
        winform: ['QLIK_USER', 'QLIK_PASSWORD'],
        jwt: ['QLIK_TOKEN'],
        certificates: ['QLIK_CERTS', 'QLIK_USER'],
        saas: ['QLIK_TOKEN'],
        noVar: []
    },
    homeConfig: function (environment) {
        if (!fs.existsSync(`${homedir}/.qlbuilder.yml`)) {
            return { error: true, message: `.qlbuilder.yml do not exists in the user home folder` }
        }

        let config = yaml.safeLoad(fs.readFileSync(`${homedir}/.qlbuilder.yml`))

        if (!config[environment]) {
            return { error: true, message: 'config exists but there is no env config there' }
        }

        // if (!config[environment].authentication.encoding) {
        //     config[environment].authentication.encoding = true
        // }

        config[environment].isHomeConfig = true
        return { error: false, message: config[environment] }
    },
    homeConfigEnvironmentsCheck: function (auth_type, homeVariables) {
        if (!envVariablesCheck.auth_config[auth_type]) {
            return { error: true, message: 'the required type was not found' }
        }

        if (auth_type == 'noVar') {
            return { error: false, message: 'the required type do not need any variables' }
        }

        let variablesContent = { error: false, message: {} }

        for (let eVar of envVariablesCheck.auth_config[auth_type]) {
            if (!homeVariables[eVar]) {
                variablesContent = { error: true, message: `${eVar} is not set` }
                break;
            }

            variablesContent.message[eVar] = homeVariables[eVar]
        }

        variablesContent.message['isHomeConfig'] = true

        return variablesContent
    },
    variables: function (auth_type) {
        if (!envVariablesCheck.auth_config[auth_type]) {
            return { error: true, message: 'The required type was not found' }
        }

        if (auth_type == 'noVar') {
            return { error: false, message: 'The required type do not require any variables' }
        }

        let variablesContent = { error: false, message: {} }

        for (let eVar of envVariablesCheck.auth_config[auth_type]) {
            if (!process.env[eVar]) {
                variablesContent = { error: true, message: `${eVar} is not set` }
                break;
            }

            variablesContent.message[eVar] = process.env[eVar]
        }

        return variablesContent
    },
    combined: function (envConfig) {
        let homeConfig = envVariablesCheck.homeConfig(envConfig.name)

        let envVariables = { error: false, message: 'No environment variables are required. QS desktop' }

        if (envConfig.authentication) {
            envVariables = envVariablesCheck.variables(envConfig.authentication.type)
        } else {
            common.write.log({ error: 'info', message: 'No authentication is provided. Will try and connect directly!', exit: false })
        }

        // both env var and home config are in error
        if (homeConfig.error && envVariables.error) {
            return {
                error: true,
                message: `Home config: ${homeConfig.message}\n${chalk.red('✖')} Environment variable: ${envVariables.message}`
            }
        }

        // only home config exists
        if (!homeConfig.error && envVariables.error) {
            return envVariablesCheck.homeConfigEnvironmentsCheck(envConfig.authentication.type, homeConfig.message)
        }

        // only env variables exists
        if (homeConfig.error && !envVariables.error) {
            return envVariables
        }

        // if both are ok:
        // check if the home config variables are ok. 
        //   yes - return home config
        //   no  - return env variables
        let homeConfigCheck = envVariablesCheck.homeConfigEnvironmentsCheck(envConfig.authentication.type, homeConfig.message)

        if (!homeConfigCheck.error) {
            return homeConfig
        }

        return envVariables
    }
}

module.exports = initialChecks;