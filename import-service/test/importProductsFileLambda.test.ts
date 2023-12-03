import { APIGatewayProxyEvent } from 'aws-lambda';
import { importProductsFile } from '../resources/importProductsFile/importProductsFile';

describe('importProductsFileLambda', () => {
    it('should handle missing "name" parameter and return a 400 error', async () => {
        const mockEvent: APIGatewayProxyEvent = {} as APIGatewayProxyEvent;

        const result = await importProductsFile(mockEvent);

        expect(result).toHaveProperty('statusCode', 400);
        expect(result.body).toBeDefined();

        const responseBody = JSON.parse(result.body);
        expect(responseBody).toHaveProperty('error', 'Bad Request');
    });

    it('should handle valid event and return a signed URL', async () => {
        const mockEvent: APIGatewayProxyEvent = {
            queryStringParameters: { name: 'test.csv' },
        } as APIGatewayProxyEvent;

        const result = await importProductsFile(mockEvent);

        expect(result).toHaveProperty('statusCode', 200);
        expect(result.body).toBeDefined();

        const responseBody = JSON.parse(result.body);
        expect(responseBody).toHaveProperty('signedUrl');
    });
});
