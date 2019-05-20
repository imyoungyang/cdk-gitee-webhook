const AWS = require('aws-sdk');
const crypto = require('crypto');
const { getSecrets } = require('./secrets-helper.js');
const { startExecution } = require('./stepfunction-helper.js');
const secretName = process.env.SECRET_NAME;
const stateMachineArn = process.env.GITEE_STATE_MACHINE;

const sign = (algorithm, secret, buffer) => {
  const hmac = crypto.createHmac(algorithm, secret);
  hmac.update(buffer, 'utf-8');
  return algorithm + '=' + hmac.digest('hex');
};

var secretStore = undefined;
/**
 * @input event: https://developer.github.com/webhooks/#example-delivery
 * @output
 *  {
      res.org = payload.repository.owner.login;
      res.repo = payload.repository.name;
      res.location = payload.repository.full_name;
      res.hooks_url = payload.repository.hooks_url;
    }
**/
exports.handler = async(event) => {
  if (secretStore == undefined) {
    secretStore = JSON.parse(await getSecrets(secretName));
  }
  const secret = secretStore.GITEE_ACCESS_TOKEN;
  const body = event.body;
  const payload = JSON.parse(body);

  // check signature
  const xHubSignature = event.headers['X-Hub-Signature'];
  const k1 = sign('sha1', secret, body);
  console.log("k1: " + k1);
  console.log("xHubSignature: " + xHubSignature);
  console.log("body: " + body);

  var res = {};
  if (k1 == xHubSignature && payload.action == 'created') {
    res.org = payload.repository.owner.login;
    res.repo = payload.repository.name;
    res.location = payload.repository.html_url;
    res.hooks_url = payload.repository.hooks_url;

    const callerIdentity = await new AWS.STS().getCallerIdentity().promise();
    const accountID = callerIdentity.Account;
    
    var props = {};
    //props.stateMachineArn = `arn:aws:states:us-east-1:${accountID}:stateMachine:gitee-webhook`;
    props.stateMachineArn = stateMachineArn;
    props.input = JSON.stringify(res);
    res.job = await startExecution(props);
  }
  console.log("res: " + JSON.stringify(res));
  return {
    statusCode: 200,
    body: JSON.stringify(res),
  };
};
