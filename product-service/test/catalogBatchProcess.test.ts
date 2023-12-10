const { handler } = require('./catalogBatchProcess');
const AWSMock = require('aws-sdk-mock');
const { mocked } = require('ts-jest/utils');

describe('catalogBatchProcess Lambda', () => {
    beforeAll(() => {
        process.env.PRODUCTS_TABLE_NAME = 'mockProductsTable';
        process.env.STOCKS_TABLE_NAME = 'mockStocksTable';
        process.env.SNS_TOPIC_ARN = 'mockSNSTopicARN';
    });

    afterAll(() => {
        AWSMock.restore('DynamoDB.DocumentClient');
        AWSMock.restore('SNS');
    });

    it('handles SQS event with missing attributes and logs an error', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({}),
                },
            ],
        };

        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleErrorMock).toHaveBeenCalledWith('Missing required attributes in the SQS message.');

        consoleErrorMock.mockRestore();
    });

    it('handles SQS event with valid and invalid records', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        title: 'Valid Product',
                        description: 'Product Description',
                        price: 30,
                        count: 50,
                    }),
                },
                {
                    body: JSON.stringify({}),
                },
            ],
        };

        const consoleErrorMock = jest.spyOn(console, 'error').mockImplementation(() => { });

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(consoleErrorMock).toHaveBeenCalledWith('Missing required attributes in the SQS message.');

        consoleErrorMock.mockRestore();
    });

    it('handles SQS event, processes records, and sends SNS notification', async () => {
        const event = {
            Records: [
                {
                    body: JSON.stringify({
                        title: 'Sample Product',
                        description: 'Product Description',
                        price: 30,
                        count: 100,
                    }),
                },
            ],
        };

        const snsPublishMock = jest.spyOn(sns, 'publish').mockReturnValue({ promise: jest.fn() });

        const result = await handler(event);

        expect(result.statusCode).toBe(200);
        expect(snsPublishMock).toHaveBeenCalledWith({
            Message: expect.any(String),
            Subject: 'Product Creation Notification',
            TopicArn: 'mockSNSTopicARN',
            MessageAttributes: {
                totalPrice: {
                    DataType: 'Number',
                    StringValue: expect.any(String),
                },
            },
        });

        snsPublishMock.mockRestore();
    });
});
