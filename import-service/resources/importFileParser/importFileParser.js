const AWS = require('aws-sdk');
const csv = require('csv-parser');
const { PassThrough } = require('stream');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

exports.importFileParser = async (event, context) => {
    try {
        const { Records } = event;

        if (!Records || Records.length === 0) {
            console.log('No records found in the S3 event.');
            return { statusCode: 200 };
        }

        const record = Records[0];
        const { bucket, object } = record.s3;
        const key = object.key;

        if (!key.startsWith('uploaded/')) {
            console.log('Object is not in the "uploaded" folder. Skipping.');
            return { statusCode: 200 };
        }

        const response = await s3.getObject({ Bucket: bucket.name, Key: key }).promise();

        const csvStream = new PassThrough();
        csvStream.end(response.Body);
        const parsedRecords = await processCsvStream(csvStream);

        const queueUrl = process.env.SQS_URL;

        await Promise.all(
            parsedRecords.map(async (row) => {
                const params = {
                    QueueUrl: queueUrl,
                    MessageBody: JSON.stringify(row),
                };

                await sqs.sendMessage(params).promise();
            })
        );

        const newKey = key.replace('uploaded/', 'parsed/');
        await s3.copyObject({ Bucket: bucket.name, CopySource: `${bucket.name}/${key}`, Key: newKey }).promise();
        await s3.deleteObject({ Bucket: bucket.name, Key: key }).promise();

        console.log('File moved to the "parsed" folder.');

        return { statusCode: 200 };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500 };
    }
};

const processCsvStream = (csvStream) => {
    return new Promise((resolve, reject) => {
        const parsedRecords = [];

        csvStream
            .pipe(csv())
            .on('data', (row) => {
                parsedRecords.push(row);
            })
            .on('end', () => {
                resolve(parsedRecords);
            })
            .on('error', (error) => {
                reject(error);
            });
    });
};