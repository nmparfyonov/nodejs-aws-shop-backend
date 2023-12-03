const AWS = require('aws-sdk');

const s3 = new AWS.S3();

exports.importProductsFile = async (event) => {
    try {
        const CORSAllow = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET,PUT',
        };
        const fileName = event.queryStringParameters.name;

        if (!fileName) {
            return buildResponse(400, "Name is required", {});
        }

        if (!fileName.match(/\.csv$/)) {
            return buildResponse(400, "Not CSV", {});
        }
        const s3Key = `uploaded/${fileName}`;

        const signedUrl = await createSignedUrl(s3Key);

        return {
            statusCode: 200,
            headers: CORSAllow,
            body: JSON.stringify({ signedUrl }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};

const createSignedUrl = async (s3Key) => {
    const signedUrl = await s3.getSignedUrlPromise('putObject', {
        Bucket: `${process.env.BUCKET_NAME}`,
        Key: s3Key,
        Expires: 180,
    });

    return signedUrl;
};
