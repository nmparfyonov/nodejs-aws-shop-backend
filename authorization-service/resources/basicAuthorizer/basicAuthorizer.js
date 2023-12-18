const { Buffer } = require('buffer');

exports.handler = async (event, ctx, cb) => {
    const { headers } = event;

    if (!headers || !headers.Authorization) {
        cb('Unauthorized');
    }

    const encodedCredentials = headers.Authorization.split(' ')[1];
    if (!encodedCredentials) {
        cb('Unauthorized');
    }
    const decodedCredentials = Buffer.from(encodedCredentials, 'base64').toString('utf-8');
    const [username, password] = decodedCredentials.split(':');

    const githubAccountLogin = process.env.GITHUB_ACCOUNT_LOGIN || '';
    const testPassword = process.env.TEST_PASSWORD || '';
    let effect = 'Allow';
    if (username !== githubAccountLogin || password !== testPassword) {
        effect = 'Deny';
    }
    const policy = generatePolicy(encodedCredentials, event.methodArn, effect);

    cb(null, policy);
};

const generatePolicy = (principalId, resource, effect = 'Allow') => {
    return {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
};
