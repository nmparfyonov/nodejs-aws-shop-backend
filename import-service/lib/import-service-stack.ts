import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as s3Notifications from 'aws-cdk-lib/aws-s3-notifications';

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const bucket = new s3.Bucket(this, 'ImportServiceBucket', {
      bucketName: 'csv-parser-shop',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
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

    const api = new apigateway.RestApi(this, 'ImportServiceAPI', {
      restApiName: "Import Service",
      description: "This service sparses csv",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
      },
    });

    const importProductsFileResource = api.root.addResource('import');
    const importProductsFileIntegration = new apigateway.LambdaIntegration(importProductsFileLambda);
    importProductsFileResource.addMethod('GET', importProductsFileIntegration);

    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      handler: 'importFileParser.importFileParser',
      code: lambda.Code.fromAsset('resources/importFileParser'),
    });

    bucket.grantReadWrite(importFileParserLambda);
    bucket.addEventNotification(s3.EventType.OBJECT_CREATED, new s3Notifications.LambdaDestination(importFileParserLambda));
  }
}
