"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require('@aws-cdk/cdk');
const iam = require("@aws-cdk/aws-iam");
const lambda = require('@aws-cdk/aws-lambda');
const apigw = require('@aws-cdk/aws-apigateway');

const stepfuctionsStatement = () => {
  const statement = new iam.PolicyStatement(iam.PolicyStatementEffect.Allow);
  statement
    .addActions(['states:*', 'secretsmanager:*'])
    .addAllResources();
  return statement;
}

class GiteeWebhookStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);

    const createRepoHandler = new lambda.Function(this, 'createRepoHandler', {
      runtime: lambda.Runtime.NodeJS810,
      code: lambda.Code.asset('lambda/createRepoHandler'),
      handler: 'index.handler'
    });
    createRepoHandler.role.addToPolicy(stepfuctionsStatement());
    createRepoHandler.addEnvironment('SECRET_NAME', props.SECRET_NAME);

    // defines an API Gateway REST API resource backed by our "createRepoHandler" function.
    const api = new apigw.RestApi(this, 'gitEEOrgWebHook');
    const repo = api.root.addResource('repo');
    repo.addMethod('POST', new apigw.LambdaIntegration(createRepoHandler, {
      proxy: true
    }));
  }
}
exports.GiteeWebhookStack = GiteeWebhookStack;
