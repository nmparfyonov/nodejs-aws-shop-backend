const handleGetRequest = async () => {
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
    const objects = JSON.stringify(products);
    return buildResponseBody(200, objects, {
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
    });
};

const routeRequest = (lambdaEvent) => {
    if (lambdaEvent.httpMethod === "GET" && lambdaEvent.path === "/products") {
        return handleGetRequest();
    }

    const error = new Error(
        `Unimplemented HTTP method: ${lambdaEvent.httpMethod}`,
    );
    error.name = "UnimplementedHTTPMethodError";
    throw error;
};

const buildResponseBody = (status, body, headers = {}) => {
    return {
        statusCode: status,
        headers,
        body,
    };
};

exports.getProductsList = async (event) => {
    try {
        return await routeRequest(event);
    } catch (err) {
        console.error(err);

        if (err.name === "UnimplementedHTTPMethodError") {
            return buildResponseBody(400, err.message);
        }

        return buildResponseBody(500, err.message || "Unknown server error");
    }
};