const os = require('os');
const chalk = require('chalk');

const messages = {
    watch: {
        reload: function () {
            let rows = [
                '\n',
                'Reload is set to "true"!\n',
                'Each successful build will trigger:\n',
                '    - check the script for syntax errors\n',
                '        - if error - stop here. The app is not saved and the script is not updated\n',
                '    - set script\n',
                '    - reload app\n',
                '    - save app\n',
                'You know ... just saying :)\n',
            ]

            return rows.join('')
        },
        disableChecks: function () {
            return chalk.yellow(`Auto syntax checks is disabled! Please use "e" or "err" anytime syntax check is required`)
        },
        commands: function () {
            let rows = [
                '\n',
                'Commands during watch mode:\n',
                '    - set script: s or set\n',
                '    - set script to all apps: sa or setall\n',
                '    - reload app: r or rl\n',
                '    - clear console: c or cls\n',
                '    - check for syntax errors: e or err\n',
                '    - show this message again: ?\n',
                '    - exit - x\n',
                '(script is checked for syntax errors every time one of the qvs files is saved)\n'
            ]
            return rows.join('')
        }
    },
    script: function () {
        let scriptRows = [
            `SET ThousandSep=',';\n`,
            `SET DecimalSep='.';\n`,
            `SET MoneyThousandSep=',';\n`,
            `SET MoneyDecimalSep='.';\n`,
            `SET MoneyFormat='$#,##0.00;($#,##0.00)';\n`,
            `SET TimeFormat='h:mm:ss TT';\n`,
            `SET DateFormat='M/D/YYYY';\n`,
            `SET TimestampFormat='M/D/YYYY h:mm:ss[.fff] TT';\n`,
            `SET MonthNames='Jan;Feb;Mar;Apr;May;Jun;Jul;Aug;Sep;Oct;Nov;Dec';\n`,
            `SET DayNames='Mon;Tue;Wed;Thu;Fri;Sat;Sun';\n`
        ]

        return scriptRows.join('')
    },
    defaultConfig: function () {
        return [
            {
                "name": "desktop",
                "host": "localhost:4848",
                "secure": false,
                "appId": `C:/Users/${os.userInfo().username}/Documents/Qlik/Sense/Apps/test.qvf`
            },
            {
                "name": "qse",
                "host": "my-qs-engine-host:4747",
                "secure": true,
                "appId": "12345678-1234-1234-1234-12345678901",
                "authentication": {
                    "type": "certificates",
                    "certLocation": "C:/path/to/cert/folder",
                    "user": "DOMAIN\\username"
                }
            },
            {
                "name": "jwt",
                "host": "my-qs-engine-host/virtual-proxy-prefix",
                "secure": true,
                "appId": "12345678-1234-1234-1234-12345678901",
                "authentication": {
                    "type": "jwt",
                    "sessionHeaderName": "X-Qlik-Session"
                }
            },
            {
                "name": "winform",
                "host": "my-qs-proxy",
                "secure": true,
                "appId": "12345678-1234-1234-1234-12345678901",
                "parseInclude": true,
                "authentication": {
                    "type": "winform",
                    "sessionHeaderName": "X-Qlik-Session"
                }
            },
            {
                "name": "saas",
                "host": "my-qs-proxy",
                "secure": true,
                "appId": "12345678-1234-1234-1234-12345678901",
                "parseInclude": true,
                "authentication": {
                    "type": "saas"
                }
            }
        ]
    },
    newVersion: function (currentVersion, gitVersion) {
        return [
            `New version is available!`,
            `Current version: ${currentVersion}`,
            `Remote version: ${gitVersion}`,
            `To install it run:`,
            `npm install -g qlbuilder`]
    },
    vscode: {
        tasks: function () {
            return JSON.stringify({
                "version": "2.0.0",
                "tasks": [
                    {
                        "label": "Set Script",
                        "detail": "Upload (set) the script to the Qlik app",
                        "type": "shell",
                        "command": "qlbuilder setscript ${config:env}"
                    },
                    {
                        "label": "Get Script",
                        "detail": "Download (get) the script from the Qlik app and save it as local files",
                        "type": "shell",
                        "command": "qlbuilder getscript ${config:env}"
                    },
                    {
                        "label": "Check Script",
                        "detail": "Check the script for syntax errors. The script is NOT set in the target app",
                        "type": "shell",
                        "command": "qlbuilder checkscript ${config:env}"
                    },
                    {
                        "label": "Build",
                        "detail": "Concatenate all local files to the \"dist\" folder. Nothing is uploaded",
                        "type": "shell",
                        "command": "qlbuilder build"
                    },
                    {
                        "label": "Reload",
                        "detail": "Upload (set) the script to the Qlik app and reloads it",
                        "type": "shell",
                        "command": "qlbuilder reload ${config:env}"
                    },
                    {
                        "label": "Encode",
                        "detail": "Encode provided text",
                        "type": "shell",
                        "command": "qlbuilder encode"
                    },
                    {
                        "label": "Watch",
                        "detail": "Start qlbuilder in watch mode. Checks the script for syntax errors on each file save",
                        "type": "shell",
                        "command": "qlbuilder watch  ${config:env}"
                    },
                    {
                        "label": "Watch Set Script",
                        "detail": "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save",
                        "type": "shell",
                        "command": "qlbuilder watch  ${config:env} -s"
                    },
                    {
                        "label": "Watch Set Script and Reload",
                        "type": "shell",
                        "detail": "Start qlbuilder in watch mode. Upload (set) the script to the Qlik app on each file save and automatically trigger reload after this",
                        "command": "qlbuilder watch  ${config:env} -r"
                    }

                ]
            }, null, 4)
        },
        settings: function () {
            return JSON.stringify({
                "env": "environment name here"
            }, null, 4)
        }
    }
}

module.exports = messages;