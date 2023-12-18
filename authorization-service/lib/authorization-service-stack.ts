import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { ServicePrincipal } from "aws-cdk-lib/aws-iam";
import * as dotenv from "dotenv";
dotenv.config()

export class AuthorizationServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const basicAuthorizerLambda = new lambda.Function(this, 'BasicAuthorizerLambda', {
      runtime: lambda.Runtime.NODEJS_14_X,
      code: lambda.Code.fromAsset('resources/basicAuthorizer'),
      functionName: "basicAuthorizer",
      handler: 'basicAuthorizer.handler',
      environment: {
        GITHUB_ACCOUNT_LOGIN: `${process.env.GITHUB_ACCOUNT_LOGIN}`,
        TEST_PASSWORD: `${process.env.TEST_PASSWORD}`,
      },
    });

    basicAuthorizerLambda.addToRolePolicy(new iam.PolicyStatement({
      actions: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
      resources: ['*'],
    }));
    basicAuthorizerLambda.grantInvoke({
      grantPrincipal: new ServicePrincipal('apigateway.amazonaws.com'),
    });
  }
}
