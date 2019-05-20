"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cdk = require('@aws-cdk/cdk');
const iam = require("@aws-cdk/aws-iam");
const lambda = require('@aws-cdk/aws-lambda');
const apigw = require('@aws-cdk/aws-apigateway');
const stepfunctions = require('@aws-cdk/aws-stepfunctions');

/*
* iam policy statement
*/
const createCodeBuildStatement = () => {
  const statement = new iam.PolicyStatement(iam.PolicyStatementEffect.Allow);
  statement
    .addActions(['codebuild:*'])
    .addAllResources();
  return statement;
}

const createWebHookStatement = () => {
  const statement = new iam.PolicyStatement(iam.PolicyStatementEffect.Allow);
  statement
    .addActions(['codebuild:*',,'secretsmanager:*'])
    .addAllResources();
  return statement;
}

const createRepoHandlerStatement = () => {
  const statement = new iam.PolicyStatement(iam.PolicyStatementEffect.Allow);
  statement
    .addActions(['states:*', 'secretsmanager:*'])
    .addAllResources();
  return statement;
}

//Stacks
class GiteeWebhookStack extends cdk.Stack {
  constructor(scope, id, props) {
    super(scope, id, props);
    
    //lambda functions
    const createCodeBuild = new lambda.Function(this, 'createCodeBuild', {
      runtime: lambda.Runtime.NodeJS810,
      code: lambda.Code.asset('lambda/createCodeBuild'),
      handler: 'index.handler'
    });
    createCodeBuild.role.addToPolicy(createCodeBuildStatement());

    const createWebHook = new lambda.Function(this, 'createWebHook', {
      runtime: lambda.Runtime.Python36,
      code: lambda.Code.asset('lambda/createWebHook'),
      handler: 'lambda_function.lambda_handler'
    });
    createWebHook.role.addToPolicy(createWebHookStatement());
    createWebHook.addEnvironment('SECRET_NAME', props.SECRET_NAME);
    
    const codeBuildTask = new stepfunctions.Task(this, 'createBuildProject', {
      resource: createCodeBuild,
      resultPath: '$.guid',
    });

    const webHookTask = new stepfunctions.Task(this, 'BuildWebHook', {
      resource: createWebHook,
      inputPath: '$.guid'
    });
    
    const definition = codeBuildTask
    .next(webHookTask);
    
    const stateMachine = new stepfunctions.StateMachine(this, 'GitEEStateMachine', {
      definition,
      timeoutSec: 300
    });
    const arnStateMachine = stateMachine.role.roleArn;

    //API Gateway
    const createRepoHandler = new lambda.Function(this, 'createRepoHandler', {
      runtime: lambda.Runtime.NodeJS810,
      code: lambda.Code.asset('lambda/createRepoHandler'),
      handler: 'index.handler'
    });
    createRepoHandler.role.addToPolicy(createRepoHandlerStatement());
    createRepoHandler.addEnvironment('SECRET_NAME', props.SECRET_NAME);
    createRepoHandler.addEnvironment('GITEE_STATE_MACHINE', arnStateMachine);

    // defines an API Gateway REST API resource backed by our "createRepoHandler" function.
    const api = new apigw.RestApi(this, 'gitEEOrgWebHook');
    const repo = api.root.addResource('repo');
    repo.addMethod('POST', new apigw.LambdaIntegration(createRepoHandler, {
      proxy: true
    }));
  }
}
exports.GiteeWebhookStack = GiteeWebhookStack;
