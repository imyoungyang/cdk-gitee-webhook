const cdk = require("@aws-cdk/cdk");
const { GiteeWebhookStack } = require('../stack/gitee-webhook-stack.js');
//app
class codeApp extends cdk.App {
  constructor(argv) {
    super(argv);
    // stack for codebuild
    argv.SECRET_NAME = this.node.getContext("SECRET_NAME");
    const webhookStack = new GiteeWebhookStack(this, 'gitee-webhook', argv);
  }
}

var argv = {};
new codeApp(argv).run();