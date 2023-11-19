import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsListHandler = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "getProductsList.getProductsList"
    });

    const getProductsByIdHandler = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_18_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "getProductsById.getProductsById"
    });

    const api = new apigateway.RestApi(this, "shop-api", {
      restApiName: "Shop Service",
      description: "This service serves products.",
      defaultCorsPreflightOptions: {
        allowOrigins: ['https://d2eoo74ecvbfun.cloudfront.net/']
      }
    });

    const getProductsList = new apigateway.LambdaIntegration(getProductsListHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    const getProductsById = new apigateway.LambdaIntegration(getProductsByIdHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.resourceForPath("products").addMethod("GET", getProductsList);
    api.root.resourceForPath("products").addResource('{id}').addMethod("GET", getProductsById);
  }
}
