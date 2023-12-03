const AWS = require('aws-sdk');

AWS.config.update({
    region: 'eu-central-1',
});

const dynamoDb = new AWS.DynamoDB.DocumentClient();

const insertTestData = async () => {
    const productsData = [
        {
            id: '1',
            title: 'Product 1',
            description: 'Description for Product 1',
            price: 100,
        },
        {
            id: '2',
            title: 'Product 2',
            description: 'Description for Product 2',
            price: 150,
        },
    ];

    const stocksData = [
        {
            product_id: '1',
            count: 50,
        },
        {
            product_id: '2',
            count: 30,
        },
    ];

    for (const product of productsData) {
        const params = {
            TableName: 'products',
            Item: product,
        };
        await dynamoDb.put(params).promise();
    }

    for (const stock of stocksData) {
        const params = {
            TableName: 'stocks',
            Item: stock,
        };
        await dynamoDb.put(params).promise();
    }

    console.log('Test data inserted successfully.');
};

insertTestData();
