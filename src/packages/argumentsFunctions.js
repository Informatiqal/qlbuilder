const fs = require('fs');
const chokidar = require('chokidar');
const readline = require('readline');
const compareVersions = require('compare-versions');
const axios = require('axios');
const filenamify = require('filenamify');
const prompts = require('prompts');

const currentVersion = require('../../package.json').version
const messages = require('./messages');
const helpers = require('./helpers');
const qlikComm = require('./qlik-comm');
const common = require('./common');
const parseLine = require('./readLine');
const argHelpers = require('./argHelpers');
const { help } = require('commander');


const create = async function (project, createTasks) {

    if (!fs.existsSync(`${process.cwd()}/${project}`)) {
        let folders = helpers.createInitFolders(project)
        if (folders.error) return folders

        let initScript = helpers.createInitialScriptFiles(project)
        if (initScript.error) return initScript

        let initConfig = helpers.createInitConfig(project)
        if (initConfig.error) return initConfig

        let gitIgnore = helpers.createGitIgnoreFile(project)
        if (gitIgnore.error) return gitIgnore

        if (createTasks) {
            let tasksFiles = helpers.createVSCodeTasks(project)
            if (tasksFiles.error) return tasksFiles
        }

        return { error: false, message: 'All set' }
    }

    const response = await prompts({
        type: 'confirm',
        name: 'value',
        message: `Folder "${project}" already exists. Do you want to overwrite the SRC and DIST folders and config.yml (if they exists)?`,
        initial: false
    })

    if (response.value == true) {
        let reCreateSrc = helpers.reCreateFolders.src(project)
        if (reCreateSrc.error) return reCreateSrc

        let reCreateDist = helpers.reCreateFolders.dist(project)
        if (reCreateDist.error) return reCreateDist

        let writeScriptFiles = helpers.createInitialScriptFiles(project)
        if (writeScriptFiles.error) return writeScriptFiles

        let writeConfig = helpers.createInitConfig(project)
        if (writeConfig.error) return writeConfig

        let gitIgnore = helpers.createGitIgnoreFile(project)
        if (gitIgnore.error) return gitIgnore

        return { error: false, message: 'All re-created' }
    } else {
        return { error: false, message: 'Ok. Nothing is performed' }
    }
}

const vscode = function () {
    let tasksFiles = helpers.createVSCodeTasks()
    if (tasksFiles.error) return tasksFiles

    return { error: false, message: 'Folder and files were created' }
}

const getScript = async function ({ environment, variables, args }) {

    let overwrite = false

    if (args.overwrite == true) {
        overwrite = true
    } else {
        overwrite = await prompts({
            type: 'confirm',
            name: 'value',
            message: 'This will overwrite all local files. Are you sure?',
            initial: false
        }).then((v) => v.value)
    }

    if (overwrite == true) {
        let getScriptFromApp = await qlikComm.getScriptFromApp({ environment, variables, debug: args.debug })
        if (getScriptFromApp.error) return getScriptFromApp

        let scriptTabs = getScriptFromApp.message.split('///$tab ')

        let clearLocalScript = helpers.clearLocalScript()
        if (clearLocalScript.error) return clearLocalScript
        common.writeLog('ok', 'Local script files removed', false)

        let writeScriptFiles = writeScriptToFiles(scriptTabs)
        if (writeScriptFiles.error) common.writeLog('ok', writeScriptFiles.message, false)

        return { error: false, message: writeScriptFiles.message }
    } else {
        return { error: false, message: 'Nothing was changed' }
    }
}

const buildScript = function () {
    return argHelpers.buildScript()
}

const checkScript = async function ({ environment, variables, args }) {
    let script = await buildScript()
    if (script.error) return script

    let result = await argHelpers.checkScript({ environment, variables, script, args })
    return result
}

const setScript = async function ({ environment, variables, args }) {
    return await argHelpers.setScript({ environment, variables, args })
}

const startWatching = async function ({ environment, variables, args }) {

    console.log(messages.watch.commands())

    if (args.reload) console.log(messages.watch.reload())

    if (args.disableChecks) console.log(messages.watch.disableChecks())

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.setPrompt('qlBuilder> ');
    rl.prompt();

    rl.on('line', async function (line) {
        let result = await parseLine({ environment, variables, line: line })

        common.writeLog(result.error ? 'err' : 'ok', result.message, result.exit)

        rl.prompt();
        // rl.prompt();
    })

    const watcher = chokidar.watch('./src/*.qvs', {
        ignorePermissionErrors: true,
        awaitWriteFinish: true,
        ignoreInitial: true,
        depth: 0
    });

    watcher
        .on('change', async function (fileName) {
            if (!args.disableChecks) {
                let result = await argHelpers.onFileChange({ environment, variables, args })

                common.writeLog(result.error ? 'err' : 'ok', result.message, result.exit)
                rl.prompt();
            }
        })
}

const reload = async function ({ environment, variables, args }) {
    let script = await buildScript()
    if (script.error) return script

    let scriptResult = await qlikComm.checkScriptSyntax({ environment, variables, script: script.message, debug: args.debug })
    if (scriptResult.error) return scriptResult

    if (scriptResult.message.length > 0) {
        argHelpers.displayScriptErrors(scriptResult.message)
        return { error: true, message: 'Syntax errors found!' }
    }

    common.writeLog('ok', 'No syntax errors', false)

    let reloadApp = await qlikComm.reloadApp({ environment, variables, script: script.message, debug: args.debug })
    if (reloadApp.error) return reloadApp

    return { error: false, message: reloadApp.message }
}

const checkForUpdate = async function () {
    try {
        let getGitData = await axios.get('https://raw.githubusercontent.com/countnazgul/qlBuilder/master/package.json')
        let gitVersion = getGitData.data.version

        if (compareVersions(gitVersion, currentVersion, '>')) {
            let message = messages.newVersion(currentVersion, gitVersion)

            return { error: false, message: message }
        } else {

            return { error: false, message: 'Latest version is already installed' }
        }

    } catch (e) {
        console.log('')
        return { error: true, message: `Unable to get the remote version number :'(` }
    }
}

const encode = {
    ask: async function () {
        try {
            const response = await prompts({
                type: 'password',
                name: 'value',
                message: 'Your secret string here:'
            })

            return { error: false, message: response.value }
        } catch (e) {
            return { error: false, message: e.message }
        }
    },
    encodeBase: function (secretString) {
        return { error: false, message: Buffer.from(secretString).toString('base64') }
    },
    combined: async function () {
        let secretString = await this.ask()
        if (secretString.error) return secretString

        let encodedString = this.encodeBase(secretString.message)

        return { error: false, message: encodedString.message }
    }
}

function writeScriptToFiles(scriptTabs) {
    try {
        for (let [i, tab] of scriptTabs.entries()) {

            if (tab.length > 0) {
                let rows = tab.split('\r\n')
                let tabName = rows[0]
                let tabNameSafe = filenamify(tabName, { replacement: '' });

                let scriptContent = rows.slice(1, rows.length).join('\r\n')

                fs.writeFileSync(`${process.cwd()}/src/${i}--${tabNameSafe}.qvs`, scriptContent)
            }
        }
        return { error: false, message: 'Local script files were created' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

module.exports = {
    create,
    vscode,
    buildScript,
    setScript,
    checkScript,
    reload,
    startWatching,
    checkForUpdate,
    getScript,
    encode
}