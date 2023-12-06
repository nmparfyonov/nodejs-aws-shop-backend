const AWS = require('aws-sdk');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.handler = async (event) => {
    try {
        const productId = event.pathParameters.id;

        const productsTable = process.env.PRODUCTS_TABLE_NAME || 'products';
        const stocksTable = process.env.STOCKS_TABLE_NAME || 'stock';
        const CORSAllow = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'OPTIONS,DELETE,GET',
        };
        const getProductParams = {
            TableName: productsTable,
            Key: {
                id: productId,
            },
        };

        const product = await dynamoDB.get(getProductParams).promise();

        if (!product.Item) {
            return {
                statusCode: 404,
                headers: CORSAllow,
                body: JSON.stringify({ message: `Product with ID ${productId} not found` }),
            };
        }

        const deleteProductParams = {
            TableName: productsTable,
            Key: {
                id: productId,
            },
        };
        await dynamoDB.delete(deleteProductParams).promise();

        const deleteStockParams = {
            TableName: stocksTable,
            Key: {
                product_id: productId,
            },
        };
        await dynamoDB.delete(deleteStockParams).promise();

        return { statusCode: 200, headers: CORSAllow, body: JSON.stringify({ message: 'Product deleted successfully' }) };
    } catch (error) {
        console.error('Error:', error);
        return { statusCode: 500, body: JSON.stringify({ message: 'Internal Server Error' }) };
    }
};
