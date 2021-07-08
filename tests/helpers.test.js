const helpers = require('../src/packages/helpers');
const initialChecks = require('../src/packages/initialChecks');

process.env.QLIK_USER = '.\test'
process.env.QLIK_PASSWORD = 'my-password'

test('initial checks', () => {
    let envDetails = initialChecks.getEnvDetails('desktop')
    expect(envDetails.error).toBe(false)
});



describe('Config environment', () => {
    test('Config file exists', () => {
        let envDetails = helpers.initialChecks.configFile()
        expect(envDetails.error).toBe(false)
    });

    test('Environment exists in config - DESKTOP', () => {
        let envDetails = helpers.initialChecks.environment('desktop')
        expect(envDetails.error).toBe(false) &&
            expect(envDetails.message.name).toBe('desktop')
    });

    test('Environment exists in config - QSE', () => {
        let envDetails = helpers.initialChecks.environment('winform')
        expect(envDetails.error).toBe(false) &&
            expect(envDetails.message.name).toBe('winform')
    });

    // duplicate???
    test('Qlik Environment Exists', () => {
        let envDetails = helpers.getEnvDetails('desktop')

        expect(envDetails.message.length).toBe(1) &&
            expect(envDetails.error).toBe(false)
    });

    test('Qlik Environment Do Not Exists', () => {
        let envDetails = helpers.getEnvDetails('desktop1')
        expect(envDetails.error).toBe(true)
    });
})

describe('Folders exists', () => {
    test('src folder exists', () => {
        let envDetails = helpers.initialChecks.srcFolder()
        expect(envDetails.error).toBe(false)
    });

    test('dist folder exists', () => {
        let envDetails = helpers.initialChecks.distFolder()
        expect(envDetails.error).toBe(false)
    });
})

describe('Environment variables', () => {
    test('Environment variables exists - DESKTOP', () => {
        let envDetails = helpers.initialChecks.environment('desktop')
        let environment = helpers.initialChecks.environmentVariables(envDetails.message)
        expect(environment.error).toBe(false)
    });

    test('Environment variables exists - QSE', () => {
        let envDetails = helpers.initialChecks.environment('winform')
        let environment = helpers.initialChecks.environmentVariables(envDetails.message)
        expect(environment.error).toBe(false) &&
            expect(environment.message.QLIK_USER.length).toBeGreaterThan(0) &&
            expect(environment.message.QLIK_PASSWORD.length).toBeGreaterThan(0)
    });
})




// test('Correct console log output', () => {
//     let outputData = "";
//     storeLog = inputs => (outputData += inputs);
//     console["log"] = jest.fn(storeLog);
//     common.writeLog('ok', 'test', false)
//     expect(outputData).toContain(`test`);
// });

// test('Throw error if no msg type is found', () => {
//     const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => { });
//     common.writeLog('ok1', 'test', false)
//     expect(mockExit).toHaveBeenCalledWith(1);
// });

// test('Throw FATAL error if no msg type is found', () => {
//     let outputData = "";
//     storeLog = inputs => (outputData += inputs);
//     console["log"] = jest.fn(storeLog);
//     common.writeLog('ok1', 'test', false)
//     expect(outputData).toContain(`FATAL`);
// });