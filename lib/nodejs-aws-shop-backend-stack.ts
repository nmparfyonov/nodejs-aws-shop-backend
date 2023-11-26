import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from 'aws-cdk-lib/aws-iam';

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));

    const getProductsListHandler = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "getProductsList.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const getProductsByIdHandler = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "getProductsById.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const addProductHandler = new lambda.Function(this, "addProduct", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources"),
      handler: "addProduct.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
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

    const addProduct = new apigateway.LambdaIntegration(addProductHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' }
    });

    api.root.resourceForPath("products").addMethod("GET", getProductsList);
    api.root.resourceForPath("products").addMethod("POST", addProduct);
    api.root.resourceForPath("products").addResource('{id}').addMethod("GET", getProductsById);
  }
}
