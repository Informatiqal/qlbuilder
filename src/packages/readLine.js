const common = require('./common');
const argHelpers = require('./argHelpers');
const qlikComm = require('./qlik-comm');
const messages = require('./messages');

const readline = async function ({ environment, variables, line }) {

    if (line == '?') return { error: false, message: messages.watch.commands() }

    if (line.toLowerCase() === "x") {
        process.stdout.write("\u001b[2J\u001b[0;0H");
        return { error: false, message: 'Bye!', exit: true }
    }

    if (line.toLowerCase() === "c" || line.toLowerCase() === "cls") {
        process.stdout.write("\u001b[2J\u001b[0;0H");

        return { error: false, message: 'Still here :)' }
    }

    if (line.toLowerCase() === "e" || line.toLowerCase() === "err") {
        let script = await argHelpers.buildScript()
        if (script.error) return script

        let checkLoadScript = await argHelpers.checkScript({ environment, variables, script: script.message })
        return checkLoadScript
    }

    if (line.toLowerCase() === "s" || line.toLowerCase() == "set") {
        let script = await argHelpers.buildScript()
        if (script.error) return script

        common.writeLog('ok', 'Script was build', false)
        
        let setScript = await qlikComm.setScript({ environment, variables, script: script.message })
        if (setScript.error) return setScript

        return setScript
    }

    if (line.toLowerCase() === "sa" || line.toLowerCase() == "setall") {
        let setAllScripts = await argHelpers.setScript({environment, variables, args: { setAll: true }})
        if (setAllScripts.error) return setScript        

        return setAllScripts
    }

    if (line.toLowerCase() === "rl" || line.toLowerCase() === "r") {
        let script = await argHelpers.buildScript()
        if (script.error) return script

        common.writeLog('ok', 'Script was build', false)

        let checkLoadScript = await argHelpers.checkScript({ environment, variables, script: script.message })
        if (checkLoadScript.error) return checkLoadScript

        common.writeLog('ok', checkLoadScript.message, false)

        let reload = await qlikComm.reloadApp({ environment, variables, script: script.message })
        if (reload.error) {
            return { error: true, message: reload.message }
        }

        return { error: false, message: reload.message }
    }
}

module.exports = readline