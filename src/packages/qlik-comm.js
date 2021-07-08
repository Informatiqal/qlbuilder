const fs = require('fs');
const os = require('os');
const homedir = os.homedir();
const eol = os.EOL;
const isBase64 = require('is-base64');
const enigma = require('enigma.js');
const WebSocket = require('ws');
const schema = require('enigma.js/schemas/12.170.2.json');
const qAuth = require('qlik-sense-authenticate');

const Spinner = require('cli-spinner').Spinner;
Spinner.setDefaultSpinnerDelay(200)

const helpers = require('./helpers')
const common = require('./common')

const setScript = async function ({ environment, variables, script, doSave = true, debug }) {
    let session = await createQlikSession({ environment, variables, debug })
    if (session.error) return session

    try {
        let spinner = new Spinner('Setting script ..');
        spinner.setSpinnerString('☱☲☴');
        spinner.start();

        let global = await session.message.open()
        let doc = await global.openDoc(environment.appId)
        await doc.setScript(script)
        spinner.stop(true)

        let spinnerSave = new Spinner('Saving ...');
        spinnerSave.setSpinnerString('◐◓◑◒');
        spinnerSave.start();

        if (doSave) {
            await doc.doSave()
        }

        await session.message.close()

        spinnerSave.stop(true)

        return { error: false, message: 'Script was set and document was saved' }
    } catch (e) {
        console.log('')
        return { error: true, message: e.message }
    }
}

const getScriptFromApp = async function ({ environment, variables, debug }) {

    let session = await createQlikSession({ environment, variables, debug })
    if (session.error) return session

    try {
        let spinner = new Spinner('Getting script ..');
        spinner.setSpinnerString('☱☲☴');
        spinner.start();

        let global = await session.message.open()
        let doc = await global.openDoc(environment.appId)
        let qScript = await doc.getScript()

        console.log('')
        common.writeLog('ok', 'Script was received', false)
        await session.message.close()

        spinner.stop(true)
        return { error: false, message: qScript }
    } catch (e) {
        console.log('')
        return { error: true, message: e.message }
    }
}

const checkScriptSyntax = async function ({ environment, variables, script, debug }) {

    let session = await createQlikSession({ environment, variables, debug })
    if (session.error) return session

    try {
        let global = await session.message.open()
        let doc = await global.createSessionApp()
        await doc.setScript(script)
        let syntaxCheck = await doc.checkScriptSyntax()
        await session.message.close()

        return { error: false, message: syntaxCheck }
    } catch (e) {
        await session.message.close()
        return { error: true, message: e.message }
    }
}

const reloadApp = async function ({ environment, variables, script, debug }) {
    let session = await createQlikSession({ environment, variables, debug })
    if (session.error) return session

    try {
        let global = await session.message.open()
        let doc = await global.openDoc(environment.appId)
        await doc.setScript(script)

        let reloadResult = await reloadAndGetProgress({ global, doc })

        let spinner = new Spinner('Saving ...');
        spinner.setSpinnerString('◐◓◑◒');
        spinner.start();

        if (reloadResult.error) {
            spinner.stop(true);
            await session.message.close()
            console.log('');
            return { error: true, message: 'Error during reload' }
        }

        await doc.doSave()
        await session.message.close()

        spinner.stop(true);

        return { error: false, message: 'App was reloaded and saved' }

    } catch (e) {
        return { error: true, message: e.message }
    }
}

function reloadAndGetProgress({ global, doc }) {
    return new Promise(function (resolve, reject) {
        console.log('')
        console.log('--------------- RELOAD STARTED ---------------')
        console.log('')

        let reloaded = false;
        let scriptError = false;
        let scriptResult = []

        let persistentProgress = '';

        doc.doReloadEx()
            .then(function (result) {
                setTimeout(function () {
                    reloaded = true
                    console.log('')
                    console.log('--------------- RELOAD COMPLETED ---------------')
                    console.log('')

                    resolve({
                        error: scriptError, message: {
                            success: result.qSuccess,
                            log: result.qScriptLogFile,
                            script: scriptResult,
                            scriptError: scriptError
                        }
                    })
                }, 1000)
            })


        let progress = setInterval(function () {
            if (reloaded != true) {
                global.getProgress(-1)
                    .then(function (msg) {


                        var timestampOptions = {
                            year: "numeric", month: "2-digit",
                            day: "2-digit", hour: "2-digit", minute: "2-digit",
                            second: "2-digit", hour12: false
                        };

                        let timestamp = new Date().toLocaleString("en-US", timestampOptions)

                        let loadError = false;

                        try {
                            loadError = msg.qPersistentProgress.toLowerCase().indexOf('script error.') > -1 ? true : false
                        } catch (e) {

                        }


                        if (msg.qErrorData.length > 0 || loadError == true) {
                            reloaded = true
                            scriptError = true
                        }

                        if (msg.qPersistentProgress && msg.qTransientProgress) {
                            persistentProgress = msg.qPersistentProgress
                            if (persistentProgress.split('\n').length > 1) {
                                console.log(`${timestamp}: ${persistentProgress.split('\n')[0]}`)
                                console.log(`${timestamp}: ${persistentProgress.split('\n')[1]} <-- ${msg.qTransientProgress}`)
                            } else {
                                console.log(`${timestamp}: ${msg.qPersistentProgress} <-- ${msg.qTransientProgress}`)
                            }
                        }

                        if (!msg.qPersistentProgress && msg.qTransientProgress) {
                            if (persistentProgress.split('\n').length > 1) {
                                console.log(`${timestamp}: ${persistentProgress.split('\n')[1]} <-- ${msg.qTransientProgress}`)
                            } else {
                                console.log(`${timestamp}: ${persistentProgress} <-- ${msg.qTransientProgress}`)
                            }
                        }

                        if (msg.qPersistentProgress && !msg.qTransientProgress) {
                            console.log(`${timestamp}: ${msg.qPersistentProgress}`)
                        }


                    })
            } else {
                clearInterval(progress)
            }
        }, 500)
    })
}

async function createQlikSession({ environment, variables, debug }) {
    let authenticationType = 'desktop'

    if (environment.authentication) {
        authenticationType = environment.authentication.type
    }
    let qsEnt = await handleAuthenticationType[authenticationType]({ environment, variables })

    if (qsEnt.error) return qsEnt

    try {
        const session = enigma.create({
            schema,
            url: `${environment.engineHost}/app/${environment.appId}/identity/${+new Date()}`,
            createSocket: url => new WebSocket(url, { headers: qsEnt.message.headers, rejectUnauthorized: false })
        });

        if (debug) {
            let builderHomeFolder = `${homedir}/qlBuilder`
            let trafficFile = `${homedir}/qlBuilder/traffic_${environment.name}.txt`

            if (!fs.existsSync(builderHomeFolder)) {
                fs.mkdirSync(`${homedir}/qlBuilder`)
            }

            session.on('traffic:*', function (direction, data) {
                fs.appendFileSync(trafficFile, `${new Date().toISOString()} ${direction.toString().toUpperCase()} ${JSON.stringify(data)} ${eol}`, 'utf8', function (err) {
                    if (err) console.log(err);
                })
            });
        }

        return { error: false, message: session }
    } catch (e) {
        return { error: true, message: e.message }
    }
}

const handleAuthenticationType = {
    desktop: async function () {
        return {}
    },
    certificates: async function ({ environment, variables }) {

        if (variables.QLIK_USER.indexOf('\\') == -1) {
            return { error: true, message: 'The username should be in format DOMAIN\\USER' }
        }

        try {
            return {
                error: false,
                message: {
                    ca: [helpers.readCert(variables.QLIK_CERTS, 'root.pem')],
                    key: helpers.readCert(variables.QLIK_CERTS, 'client_key.pem'),
                    cert: helpers.readCert(variables.QLIK_CERTS, 'client.pem'),
                    headers: {
                        'X-Qlik-User': `UserDirectory=${encodeURIComponent(variables.QLIK_USER.split('\\')[0])}; UserId=${encodeURIComponent(variables.QLIK_USER.split('\\')[1])}`,
                    }
                }
            }
        } catch (e) {
            return { error: true, message: e.message }
        }
    },
    jwt: async function ({ environment, variables }) {
        return {
            error: false, message: {
                headers: { Authorization: `Bearer ${variables.QLIK_TOKEN}` },
            }
        }
    },
    winform: async function ({ environment, variables }) {

        let sessionHeaderName = 'X-Qlik-Session'
        if (environment.authentication.sessionHeaderName) {
            sessionHeaderName = environment.authentication.sessionHeaderName
        }

        if (variables.QLIK_USER.indexOf('\\') == -1) {
            return { error: true, message: 'The username should be in format DOMAIN\\USER' }
        }

        // decode the password only if the password is coming from .qlbuilder.yml
        // and encoding != false in the env config (the used don't want to use encoded password)
        if (variables.isHomeConfig && environment.authentication.encoding) {
            if (!isBase64(variables.QLIK_PASSWORD)) {
                return { error: true, message: 'Please do not store passwords in plain text! Use "qlbuilder encode" to get the encoded version of the password and update the yml entry' }
            }

            let decodedPassword = common.decode(variables.QLIK_PASSWORD)
            variables.QLIK_PASSWORD = decodedPassword.message
        }

        let auth_config = {
            type: 'win',
            props: {
                url: environment.host,
                proxy: '',
                username: variables.QLIK_USER,
                password: variables.QLIK_PASSWORD,
                header: sessionHeaderName,
                rejectUnauthorized: false
            }
        }

        let sessionId = await qAuth.login(auth_config)

        if (sessionId.error) {
            return sessionId
        }

        return {
            error: false,
            message: {
                headers: {
                    'Cookie': `${sessionHeaderName}=${sessionId.message}`,
                }
            }
        }
    },
    saas: async function ({ environment, variables }) {
        return {
            error: false,
            message: {
                headers: {
                    'Authorization': `Bearer ${variables.QLIK_TOKEN}`,
                }
            }
        }
    }
}

module.exports = {
    setScript,
    checkScriptSyntax,
    reloadApp,
    getScriptFromApp,
    handleAuthenticationType
}