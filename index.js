module.exports = (integration) => {
  const controller = {};

  const AWS = require('aws-sdk');
  AWS.config.update({
    accessKeyId: integration.settings.accessKeyId,
    secretAccessKey: integration.settings.secretAccessKey,
    region: integration.settings.region,
  });

  const connect = (setTimeoutOptions) => {
    const timeoutOptions = setTimeoutOptions
      ? {
        httpOptions: {
          connectTimeout: 1000,
          timeout: 50000,
        },
        maxRetries: 0,
      }
      : {};
    return new AWS.S3(timeoutOptions);
  };

  controller.write = async (filePath, data) => {
    const fs = connect();
    const params = {
      Bucket: integration.settings.bucket,
      Key: filePath,
      Body: data,
      ACL: 'public-read',
    };
    return fs.upload(params).promise();
  };

  controller.read = async (filePath, format) => {
    const fs = connect(true);
    const params = {
      Bucket: integration.settings.bucket,
      Key: filePath,
      ResponseContentType: 'image/' + format,
    };
    const data = await fs.getObject(params).promise();
    return data.Body;
  };

  controller.exists = async (filePath) => {
    const fs = connect(true);
    const params = {
      Bucket: integration.settings.bucket,
      MaxKeys: 1,
      Prefix: filePath,
    };
    // Seems like listObjectsV2 does not work with .promise() method from AWS
    // SDK, that is why we used call back bellow TODO: Test it in the future
    // and if necessary report to AWS
    return new Promise((resolve, reject) => {
      fs.listObjectsV2(params, (err, data) => {
        if (err || !data || !data.Contents || data.Contents.length !== 1) {
          reject(err);
        } else {
          resolve(true);
        }
      });
    });
  };

  return controller;
};
