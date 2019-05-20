const AWS = require("aws-sdk");
const { createCodeBuild } = require('./codebuild-helper.js');

/**
 * @input {org, repo, location}
 * @return {org, repo, location, projectName}
**/
exports.handler = async (event, context, callback) => {
  const callerIdentity = await new AWS.STS().getCallerIdentity().promise();
  const accountID = callerIdentity.Account;

  var props = JSON.parse(JSON.stringify(event));
  props.role = `arn:aws:iam::${accountID}:role/codebuild-execution-full-access`;
  props.accountID = accountID.toString();
  props.projectName = props.org + "_" + props.repo;

  var codeBuildProject = await createCodeBuild(props);
  callback(null, props);
};
