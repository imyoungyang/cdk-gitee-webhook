Object.defineProperty(exports, "__esModule", { value: true });

const AWS = require('aws-sdk');

var codebuild = undefined;

const artifacts = (options) => {
  if (options.bucket && options.prefix) {
    return  { 
      type: 'S3',
      packaging: 'ZIP',
      location: options.bucket,
      path: `${options.prefix}/${options.repo}`
    }
  } else {
    return { type: 'NO_ARTIFACTS'}
  }
};

/**
 * Create a new CodeBuild project for a repository.
 *
 * @param {object} options
 * @param {string} options.org
 * @param {string} options.repo
 * @param {string} options.location (https://HOSTNAME/:owner/:repo)
 * @param {string} options.imageUri - default aws/codebuild/docker:18.09.0
 *  @cli aws codebuild list-curated-environment-images
 *  @see https://docs.aws.amazon.com/codebuild/latest/userguide/build-env-ref-available.html
 * @param {string} options.size - small, medium, or large
 * @param {string} options.bucket
 * @param {string} options.prefix
 * @param {string} options.region - for the CodeBuild project
 * @param {string} options.role - ARN for project's IAM role
 * @param {string} options.accountID - for ECR account
 * @returns {Promise} CodeBuild project information
 */
const createProjectWithGITEESource = (options) => {
  // handle default value
  if (!options.size) options.size = 'small';
  if (!options.imageUri) options.imageUri = 'aws/codebuild/docker:18.09.0';
  
  const project = {
    name: `${options.org}_${options.repo}`,
    description: `Code build projects for ${options.org}/${options.repo}`,
    serviceRole: options.role,
    source: {
      type: 'GITHUB_ENTERPRISE',
      location: options.location,
      insecureSsl: true
    },
    artifacts: artifacts(options),
    environment: {
      type: 'LINUX_CONTAINER',
      image: options.imageUri,
      computeType: `BUILD_GENERAL1_${options.size.toUpperCase()}`,
      privilegedMode: true,
      environmentVariables: [
        { name: 'AWS_ACCOUNT_ID', value: options.accountID }
      ]
    }
  };
  
  if (codebuild == undefined) {
    codebuild = new AWS.CodeBuild();
  }
  
  return new Promise((resolve,reject) => {
    codebuild.createProject(project, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(data);
      }
    });
  });
}

exports.createCodeBuild = createProjectWithGITEESource;
