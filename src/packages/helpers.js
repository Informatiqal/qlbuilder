const fs = require('fs');
const yaml = require('js-yaml');
// const os = require('os');
const path = require('path');
const rimraf = require('rimraf');
const { orderBy } = require('natural-orderby');

// const common = require('./common');
const messages = require('./messages');

// process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0;

const createInitFolders = function (project) {
    try {
        fs.mkdirSync(`./${project}`)
        fs.mkdirSync(`./${project}/src`)
        fs.mkdirSync(`./${project}/dist`)

        return { error: false, message: 'All folders were created' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const createInitialScriptFiles = function (project) {
    try {
        fs.writeFileSync(`./${project}/src/0--Main.qvs`, messages.script())
        fs.writeFileSync(`./${project}/dist/LoadScript.qvs`, buildLoadScript(project))

        return { error: false, message: 'Initial script files were generated' }

    } catch (e) {
        return { error: true, message: e.message }
    }
}

const createInitConfig = function (project) {

    let defaultConfig = messages.defaultConfig()

    try {
        fs.writeFileSync(`./${project}/config.yml`, yaml.dump(defaultConfig))

        return { error: false, message: 'config.yml was created and populated with the default values' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const createGitIgnoreFile = function (project) {

    // append if gitignore already exists
    if (fs.existsSync(`./${project}/.gitignore`)) {
        try {
            fs.appendFileSync(`./${project}/.gitignore`, '\nsession.txt')
            return { error: false, message: 'append' }
        } catch (e) {
            return { error: true, message: e.message }
        }
    }

    // create if gitignore do not exists
    try {
        fs.writeFileSync(`./${project}/.gitignore`, 'session.txt')
        return { error: false, message: 'gitignore was created' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const buildLoadScript = function (initProject) {
    let projectFolder = ''
    if (initProject) {
        projectFolder = `${initProject}/`
    }

    let scriptFiles = fs.readdirSync(`./${projectFolder}src`).filter(function (f) {
        return f.indexOf('.qvs') > -1
    })

    scriptFiles = orderBy(scriptFiles)

    let buildScript = []
    for (let file of scriptFiles) {
        let tabName = file.replace('.qvs', '').split('--')[1]
        let fileContent = fs.readFileSync(`./${projectFolder}src/${file}`)

        buildScript.push(`///$tab ${tabName}\r\n${fileContent}`)
    }

    return buildScript.join('\n\n')
}

const createVSCodeTasks = function (project) {
    try {
        fs.mkdirSync(`./.vscode`)
        fs.writeFileSync(`./.vscode/tasks.json`, messages.vscode.tasks())
        fs.writeFileSync(`./.vscode/settings.json`, messages.vscode.settings())

        return { error: false, message: 'VSCode specific folder and files were created' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const writeLoadScript = function (script) {
    try {
        fs.writeFileSync('./dist/LoadScript.qvs', script)

        return { error: false, message: 'Script saved' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const readCert = function (certPath, filename) {
    return fs.readFileSync(`${certPath}/${filename}`);
}

const clearLocalScript = async function () {
    try {
        let directory = './src'

        let files = fs.readdirSync(directory)

        for (let file of files) {
            fs.unlinkSync(path.join(directory, file));
        }

        return { error: false, message: 'Local script files removed' }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const generateXrfkey = function (length) {
    return [...Array(length)].map(i => (~~(Math.random() * 36)).toString(36)).join('')
}

const reCreateFolders = {
    src: function (project) {
        let srcFolder = `./${project}/src`

        if (!fs.existsSync(srcFolder)) {
            try {
                fs.mkdirSync(srcFolder)
                return { error: false, message: 'SRC folder was created' }
            } catch (e) {
                return { error: true, message: e.message }
            }
        }

        try {
            rimraf.sync(srcFolder)
            fs.mkdirSync(srcFolder)
            return { error: false, message: 'SRC folder was re-created' }
        } catch (e) {
            return { error: true, message: e.message }
        }
    },
    dist: function (project) {
        let distFolder = `./${project}/dist`

        if (!fs.existsSync(distFolder)) {
            try {
                fs.mkdirSync(distFolder)
                return { error: false, message: 'DIST folder was created' }
            } catch (e) {
                return { error: true, message: e.message }
            }
        }

        try {
            rimraf.sync(distFolder)
            fs.mkdirSync(distFolder)
            return { error: false, message: 'DIST folder was re-created' }
        } catch (e) {
            return { error: true, message: e.message }
        }
    }
    // config: function (project) {
    //     // let confPath = `${project}/config.yml`
    //     // if(!fs.ex)

    // }
}

module.exports = {
    createInitFolders,
    createInitialScriptFiles,
    createGitIgnoreFile,
    createVSCodeTasks,
    createInitConfig,
    buildLoadScript,
    writeLoadScript,
    readCert,
    clearLocalScript,
    generateXrfkey,
    reCreateFolders
}