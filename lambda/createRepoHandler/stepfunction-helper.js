Object.defineProperty(exports, "__esModule", { value: true });

const AWS = require('aws-sdk');
var stepfunctions;

/**
 * {
 *  "stateMachineArn": 'STRING_VALUE',
 *  "input": "{\"first_name\" : \"test\"}" (STRING of JSON)
 * };
 **/
const startExecution = (props) => {
  return new Promise((resolve, reject) => {
    if (!stepfunctions) stepfunctions = new AWS.StepFunctions();
    stepfunctions.startExecution(props, (err, data) => {
      if (err) {
        reject(err);
      }
      else {
        resolve(data);
      }
    });
  });
};

exports.startExecution = startExecution;