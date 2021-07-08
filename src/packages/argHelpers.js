const Spinner = require('cli-spinner').Spinner;
Spinner.setDefaultSpinnerDelay(200);

const fs = require('fs');

const helpers = require('./helpers');
const qlikComm = require('./qlik-comm');
const common = require('./common');

const buildScript = async function () {
    let loadScript = helpers.buildLoadScript()

    let writeScript = helpers.writeLoadScript(loadScript)
    if (writeScript.error) return writeScript

    return ({ error: false, message: loadScript })
}

const checkScript = async function ({ environment, variables, script, args }) {
    let spinner = new Spinner('Checking for syntax errors ...');
    spinner.setSpinnerString('☱☲☴');
    spinner.start();

    let loadScript = ''

    if (script) {
        let script = await buildScript()
        if (script.error) return script

        loadScript = script.message
    }

    let scriptResult = await qlikComm.checkScriptSyntax({ environment, variables, script: loadScript, debug: args.debug })
    if (scriptResult.error) {
        spinner.stop(true)
        return scriptResult
    }

    spinner.stop(true)

    if (scriptResult.message.length > 0) {
        displayScriptErrors(scriptResult.message)
        return { error: true, message: 'Syntax errors found!' }
    }

    return { error: false, message: 'No syntax errors were found' }
}

const setScript = async function ({ environment, variables, args }) {
    let script = await buildScript()
    if (script.error) return script

    let setScript = await qlikComm.setScript({ environment, variables, script: script.message, debug: args.debug })
    if (setScript.error) return setScript

    if (args.setAll) {
        if (environment.otherApps && environment.otherApps.length > 0) {
            await Promise.all(environment.otherApps.map(async function (a) {
                let tempEnvironment = environment
                tempEnvironment.appId = a

                common.write.log({ error: 'info', message: `Setting script for ${a}`, exit: false })
                let additionalSetScript = await qlikComm.setScript({ environment: tempEnvironment, variables, script: script.message })
                common.write.log({ error: 'false', message: `Script set for ${a}`, exit: false })

                return additionalSetScript
            }))
                .then(function () {
                    return { error: false, message: setScript.message }
                })
        }
    }

    return { error: false, message: setScript.message }
}

function displayScriptErrors(scriptResultObj) {
    let scriptFiles = fs.readdirSync(`./src`).filter(function (f) {
        return f.indexOf('.qvs') > -1
    })

    let scriptErrorsPrimary = scriptResultObj.filter(function (e) {
        return !e.qSecondaryFailure
    })

    for (let scriptError of scriptErrorsPrimary) {
        let tabScript = fs.readFileSync(`./src/${scriptFiles[scriptError.qTabIx]}`).toString().split('\n')

        console.log(`
Tab : ${scriptFiles[scriptError.qTabIx]} 
Line: ${scriptError.qLineInTab} 
Code: ${tabScript[scriptError.qLineInTab - 1]}`)
    }
}

const onFileChange = async function ({ environment, variables, args }) {
    let script = await buildScript()
    if (script.error) return script

    let checkLoadScript = await checkScript({ environment, variables, script: script.message, args })
    if (checkLoadScript.error) return checkLoadScript

    // if only SetScript is set
    if (!args.reload && args.setScript) {
        let setScript = await qlikComm.setScript({ environment, variables, script: script.message, args })
        if (setScript.error) return { error: true, message: setScript.message }

        return { error: false, message: setScript.message }
    }

    // if Reload is set AND/OR SetScript is set
    if (args.reload) {
        let reload = await qlikComm.reloadApp({ environment, variables, script: script.message, args })
        if (reload.error) return { error: true, message: reload.message }

        return { error: false, message: reload.message }
    }

    return checkLoadScript
}



module.exports = {
    buildScript,
    checkScript,
    displayScriptErrors,
    setScript,
    onFileChange
}