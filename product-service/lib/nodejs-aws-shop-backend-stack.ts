import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import * as eventSources from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

export class NodejsAwsShopBackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {
      queueName: "catalogItemsQueue",
      visibilityTimeout: cdk.Duration.seconds(30),
    });

    const createProductTopic = new sns.Topic(this, 'CreateProductTopic', {
      displayName: 'Create Product Topic',
    });

    createProductTopic.addSubscription(new subs.EmailSubscription('nikita.maximovi4+1000@gmail.com', {
      filterPolicy: {
        totalPrice: sns.SubscriptionFilter.numericFilter({ greaterThan: 1000 }),
      },
    }));

    createProductTopic.addSubscription(new subs.EmailSubscription('nikita.maximovi4+999@gmail.com', {
      filterPolicy: {
        totalPrice: sns.SubscriptionFilter.numericFilter({ lessThanOrEqualTo: 1000 }),
      },
    }));

    const lambdaRole = new iam.Role(this, 'LambdaRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
    })
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonDynamoDBFullAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('AmazonSQSFullAccess'));
    lambdaRole.addManagedPolicy(iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchLogsFullAccess'));

    const getProductsListHandler = new lambda.Function(this, "getProductsList", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/getProductsList"),
      handler: "getProductsList.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const getProductsByIdHandler = new lambda.Function(this, "getProductsById", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/getProductsById"),
      handler: "getProductsById.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const addProductHandler = new lambda.Function(this, "addProduct", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/addProduct"),
      handler: "addProduct.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const deleteProductHandler = new lambda.Function(this, "deleteProduct", {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset("resources/deleteProduct"),
      handler: "deleteProduct.handler",
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
      },
    });

    const catalogBatchProcessLambda = new lambda.Function(this, 'catalogBatchProcess', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/catalogBatchProcess'),
      handler: 'catalogBatchProcess.handler',
      role: lambdaRole,
      environment: {
        PRODUCTS_TABLE_NAME: 'products',
        STOCKS_TABLE_NAME: 'stock',
        SQS_URL: catalogItemsQueue.queueUrl,
        REGION: this.region,
        SNS_TOPIC_ARN: createProductTopic.topicArn,
      },
    });

    createProductTopic.grantPublish(catalogBatchProcessLambda);

    catalogBatchProcessLambda.addEventSource(new eventSources.SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    const api = new apigateway.RestApi(this, "shop-api", {
      restApiName: "Shop Service",
      description: "This service serves products.",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
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

    const deleteProduct = new apigateway.LambdaIntegration(deleteProductHandler, {
      requestTemplates: { "application/json": '{ "statusCode": "200" }' },
    });

    api.root.resourceForPath("products").addMethod("GET", getProductsList);
    api.root.resourceForPath("products").addMethod("POST", addProduct);
    api.root.resourceForPath("products").addResource('{id}').addMethod("GET", getProductsById);
    api.root.resourceForPath("product").addResource('{id}').addMethod("DELETE", deleteProduct);
  }
}
