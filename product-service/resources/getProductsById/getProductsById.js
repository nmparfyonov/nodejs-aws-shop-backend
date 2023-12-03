const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log(event);
    try {
        const productsTableName = process.env.PRODUCTS_TABLE_NAME;
        const stocksTableName = process.env.STOCKS_TABLE_NAME;

        const productId = event.pathParameters.id;
        const CORSAllow = {
            'Access-Control-Allow-Origin': 'https://d2eoo74ecvbfun.cloudfront.net',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        };
        const productParams = {
            TableName: productsTableName,
            Key: {
                id: productId,
            },
        };

        const productResult = await dynamoDb.get(productParams).promise();

        if (!productResult.Item) {
            return {
                statusCode: 404,
                headers: CORSAllow,
                body: JSON.stringify({ error: 'Product not found' }),
            };
        }

        const stockParams = {
            TableName: stocksTableName,
            Key: {
                product_id: productId,
            },
        };

        const stockResult = await dynamoDb.get(stockParams).promise();
        const stock = stockResult.Item || { count: 0 };

        const product = {
            id: productResult.Item.id,
            title: productResult.Item.title,
            description: productResult.Item.description || '',
            price: productResult.Item.price,
            count: stock.count,
        };

        return {
            statusCode: 200,
            headers: CORSAllow,
            body: JSON.stringify(product),
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
