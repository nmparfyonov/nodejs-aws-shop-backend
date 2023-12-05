const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();
const { v4: uuidv4 } = require('uuid');

exports.handler = async (event) => {
    console.log(event);
    try {
        const productsTableName = process.env.PRODUCTS_TABLE_NAME;
        const stocksTableName = process.env.STOCKS_TABLE_NAME;
        const CORSAllow = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        };
        const requestBody = JSON.parse(event.body);

        if (!requestBody.title || !requestBody.price || !requestBody.count) {
            return {
                statusCode: 400,
                headers: CORSAllow,
                body: JSON.stringify({ error: 'Title, price, and count are required fields' }),
            };
        }

        const productId = uuidv4();

        const productParams = {
            TableName: productsTableName,
            Item: {
                id: productId,
                title: requestBody.title,
                description: requestBody.description || '',
                price: requestBody.price,
            },
        };

        await dynamoDb.put(productParams).promise();

        const stockParams = {
            TableName: stocksTableName,
            Item: {
                product_id: productId,
                count: requestBody.count,
            },
        };

        await dynamoDb.put(stockParams).promise();

        return {
            statusCode: 201,
            headers: CORSAllow,
            body: JSON.stringify({ message: 'Product created successfully', productId }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: CORSAllow,
            body: JSON.stringify({ error: 'Internal Server Error' }),
        };
    }
};
