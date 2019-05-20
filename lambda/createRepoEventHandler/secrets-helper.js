Object.defineProperty(exports, "__esModule", { value: true });

var AWS = require('aws-sdk'),
  client = undefined;

var getSecrets = (secretName) => {
  return new Promise((resolve, reject) => {
    var self = this;
    var secret = '';
    if (self.client == undefined) {
      self.client = new AWS.SecretsManager();
    }
    self.client.getSecretValue({ SecretId: secretName }, function(err, data) {
      if (err) {
        reject(err);
      }
      else {
        if ('SecretString' in data) {
          secret = data.SecretString;
        }
      }
      resolve(secret);
    });
  });
};

exports.getSecrets = getSecrets;