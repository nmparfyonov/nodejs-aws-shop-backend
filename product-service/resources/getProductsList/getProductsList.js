const AWS = require('aws-sdk');
const dynamoDb = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    console.log(event);
    try {
        const productsTableName = process.env.PRODUCTS_TABLE_NAME;
        const stocksTableName = process.env.STOCKS_TABLE_NAME;
        const CORSAllow = {
            'Access-Control-Allow-Origin': 'https://d2eoo74ecvbfun.cloudfront.net',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
        };
        const params = {
            TableName: productsTableName,
        };

        const result = await dynamoDb.scan(params).promise();

        const productsList = await Promise.all(
            result.Items.map(async (product) => {
                const stockParams = {
                    TableName: stocksTableName,
                    Key: {
                        product_id: product.id,
                    },
                };

                const stockResult = await dynamoDb.get(stockParams).promise();
                const stock = stockResult.Item || { count: 0 };

                return {
                    id: product.id,
                    title: product.title,
                    description: product.description || '',
                    price: product.price,
                    count: stock.count,
                };
            })
        );

        return {
            statusCode: 200,
            headers: CORSAllow,
            body: JSON.stringify(productsList),
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
