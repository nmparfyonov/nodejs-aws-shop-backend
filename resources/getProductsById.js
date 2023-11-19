const searchItem = async (requestedItemId) => {
    const products = [{
        description: "Short Product Description1",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80aa",
        price: 24,
        title: "ProductOne"
    }, {
        description: "Short Product Description7",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80a1",
        price: 15,
        title: "ProductTitle"
    }, {
        description: "Short Product Description2",
        id: "7567ec4b-b10c-48c5-9345-fc73c48a80a3",
        price: 23,
        title: "Product"
    }, {
        description: "Short Product Description4",
        id: "7567ec4b-b10c-48c5-9345-fc73348a80a1",
        price: 15,
        title: "ProductTest"
    }, {
        description: "Short Product Descriptio1",
        id: "7567ec4b-b10c-48c5-9445-fc73c48a80a2",
        price: 23,
        title: "Product2"
    }, {
        description: "Short Product Description7",
        id: "7567ec4b-b10c-45c5-9345-fc73c48a80a1",
        price: 15,
        title: "ProductName"
    }];
    const product = products.filter(x => x.id === requestedItemId);
    if (product.length) {
        const object = JSON.stringify(product[0]);
        return buildResponseBody(200, object, {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        });
    } else {
        return buildResponseBody(404, 'Item not found', {
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET',
        });
    }
};


const buildResponseBody = (status, body, headers = {}) => {
    return {
        statusCode: status,
        headers,
        body,
    };
};

exports.getProductsById = async (event) => {
    const requestedItemId = event.pathParameters.id;
    if (!requestedItemId) {
        return { statusCode: 400, body: `Error: You are missing the path parameter id` };
    }

    try {
        const response = searchItem(requestedItemId);
        if (response) {
            return response;
        }
    } catch (error) {
        return { statusCode: 500, body: JSON.stringify(error) };
    }
};