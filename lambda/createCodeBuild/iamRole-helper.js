Object.defineProperty(exports, "__esModule", { value: true });

const AWS = require('aws-sdk');
var iam = undefined;

/*
* options.projectName = org + "_" + repo
*/
const createIAMRole = (options) => {
  const policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "ecr:*",
                "s3:*",
                "logs:*",
                "cloudtrail:LookupEvents"
            ],
            "Resource": "*"
        }
    ]
  };
  
  const trust_policy={
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "",
        "Effect": "Allow",
        "Principal": {
          "Service": "codebuild.amazonaws.com"
        },
        "Action": "sts:AssumeRole"
      }
    ]
  };
  
  const roleParams = {
    AssumeRolePolicyDocument: JSON.toString(trust_policy),
    Path: "/", 
    RoleName: `codebuild_${options.projectName}_Role`    
  };
  
  if (iam == undefined) {
    iam = new AWS.IAM();
  }
  
  return new Promise((resolve,reject) => {
    iam.createRole(roleParams, (err,data) => {
      if (err) console.log(err.toString());
      if (data) {
        const Role = data.Role;
        const roleName = data.Role.RoleName;
        const roleArn = data.Role.Arn;
        const rolePolicyParams = {
          PolicyDocument: JSON.toString(policy),
          PolicyName: `codebuild_${options.projectName}_Policy`,
          RoleName: roleName
        };
        iam.putRolePolicy(rolePolicyParams, (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(roleArn);
          }
        });
      }
    });
  });
}

exports.createIAMRole = createIAMRole;
