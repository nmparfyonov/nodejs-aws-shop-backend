import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as sqs from 'aws-cdk-lib/aws-sqs';
export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ImportServiceBucket', {
      bucketName: 'csv-parser-shop',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      cors: [
        {
          allowedMethods: [s3.HttpMethods.GET, s3.HttpMethods.PUT],
          allowedOrigins: apigateway.Cors.ALL_ORIGINS,
          allowedHeaders: apigateway.Cors.DEFAULT_HEADERS,
        },
      ],
    });

    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'importProductsFile.importProductsFile',
      code: lambda.Code.fromAsset('resources/importProductsFile'),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });

    bucket.grantReadWrite(importProductsFileLambda);

    const basicAuthorizerLambda = lambda.Function.fromFunctionName(this, 'basicAuthorizer', 'basicAuthorizer')
    const basicAuthorizer = new apigateway.RequestAuthorizer(this, "basicAPIAuthorizer", {
      handler: basicAuthorizerLambda,
      identitySources: [apigateway.IdentitySource.header('Authorization')]
    })

    const api = new apigateway.RestApi(this, 'ImportServiceAPI', {
      restApiName: "Import Service",
      description: "This service sparses csv",
      defaultMethodOptions: {
        authorizer: basicAuthorizer,
      },
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    api.addGatewayResponse("4XX", {
      type: apigateway.ResponseType.DEFAULT_4XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type'",
        'Access-Control-Allow-Methods': "'OPTIONS,POST,GET,PUT'",
      },
    })

    api.addGatewayResponse("5XX", {
      type: apigateway.ResponseType.DEFAULT_5XX,
      responseHeaders: {
        'Access-Control-Allow-Origin': "'*'",
        'Access-Control-Allow-Headers': "'Content-Type'",
        'Access-Control-Allow-Methods': "'OPTIONS,POST,GET,PUT'",
      },
    })

    const importProductsFileResource = api.root.addResource('import');
    const importProductsFileIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);
    importProductsFileResource.addMethod('GET', importProductsFileIntegration);

    const itemsQueue = sqs.Queue.fromQueueArn(this, "catalogItemsQueue",
      `arn:aws:sqs:${this.region}:${this.account}:catalogItemsQueue`
    );

    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'importFileParser.importFileParser',
      code: lambda.Code.fromAsset('resources/importFileParser'),
      environment: {
        SQS_URL: itemsQueue.queueUrl,
      },
    });

    itemsQueue.grantSendMessages(importFileParserLambda);
    bucket.grantReadWrite(importFileParserLambda);
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Notifications.LambdaDestination(importFileParserLambda));
  }
}
