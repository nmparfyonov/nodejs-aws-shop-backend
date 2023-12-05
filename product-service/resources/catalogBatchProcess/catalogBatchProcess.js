const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const { Records } = event;

        if (!Records || Records.length === 0) {
            console.log('No records found in the SQS event.');
            return { statusCode: 200 };
        }

        const productsTable = process.env.PRODUCTS_TABLE_NAME || 'products';
        const stocksTable = process.env.STOCKS_TABLE_NAME || 'stock';

        const requests = Records.map((record) => {
            const body = JSON.parse(record.body);

            if (!body.title || !body.description || !body.price || !body.count) {
                console.error('Missing required attributes in the SQS message.');
                return null;
            }

            const productId = uuidv4();

            const productRequest = {
                PutRequest: {
                    Item: {
                        id: productId,
                        title: body.title,
                        description: body.description,
                        price: body.price,
                    },
                },
            };

            const stockRequest = {
                PutRequest: {
                    Item: {
                        product_id: productId,
                        count: body.count,
                    },
                },
            };

            return { productRequest, stockRequest };
        });

        const validRequests = requests.filter((request) => request !== null);

        const productRequests = validRequests.map((request) => request.productRequest);
        const stockRequests = validRequests.map((request) => request.stockRequest);

        if (productRequests.length > 0) {
            const productBatchWriteParams = {
                RequestItems: {
                    [productsTable]: productRequests,
                },
            };
            await dynamoDB.batchWrite(productBatchWriteParams).promise();
        }

        if (stockRequests.length > 0) {
            const stockBatchWriteParams = {
                RequestItems: {
                    [stocksTable]: stockRequests,
                },
            };
            await dynamoDB.batchWrite(stockBatchWriteParams).promise();
        }

        console.log('Products and stocks created in DynamoDB.');

        return { statusCode: 200 };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500 };
    }
};
