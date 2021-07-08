const fs = require('fs');
const chalk = require('chalk');

const write = {
    log: function ({ error, message, exit = false }) {
        let symbol = {
            true: chalk.red('✖'),
            warn: chalk.yellow('\u26A0'),
            false: chalk.green('√'),
            info: chalk.yellow('\u24D8')
        }

        let logMessage = `${symbol[error.toString()]} ${message}`

        console.log(logMessage)

        if (exit) {
            process.exit()
        }
    },

    file: function (path, content) {
        return fs.writeFileSync(path, content)
    }
}

const writeLog = function (type, message, exit) {
    let symbol = {
        err: chalk.red('✖'),
        warn: chalk.yellow('\u26A0'),
        ok: chalk.green('√'),
        info: chalk.yellow('\u24D8')
    }

    let logMessage = `${symbol[type]} ${message}`

    console.log(logMessage)

    if (exit) {
        process.exit()
    }

}

const decode = function (encodedString) {
    let decodedString = Buffer.from(encodedString, 'base64').toString()
    return { error: false, message: decodedString }
}

module.exports = {
    writeLog,
    write,
    decode
}