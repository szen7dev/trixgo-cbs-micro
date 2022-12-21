// const fs    = require('fs');
const uuidv4  = require('uuid').v4;
const AWS   = require('aws-sdk');
const s3 = require('@auth0/s3');
const compressing = require('compressing');

const config = {
    aws_access_key_id       : process.env.AWS_ACCESS_KEY || "AKIA5JR5UVVOKKWCDAN3",
    aws_secret_access_key   : process.env.AWS_SECRET_KEY || "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",
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "trx-main", // trx-demo-003
    signedUrlExpireSeconds  : 60000
}
console.log({ config })

AWS.config.update({
    accessKeyId : config.aws_access_key_id,
    secretAccessKey : config.aws_secret_access_key,
    region: config.aws_region,
})
const s3Object = new AWS.S3({
  signatureVersion: 'v2',
});

const client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId : config.aws_access_key_id,
        secretAccessKey : config.aws_secret_access_key,
        region: config.aws_region,
      // endpoint: 's3.yourdomain.com',
      // sslEnabled: false
      // any other options are passed to new AWS.S3()
      // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    },
});

const downloadFileS3 = async (filename, filepath) => {
	const params = {
		localFile: `downloads/${uuidv4()}-${Date.now()}__${filename}`,
		s3Params: {
			Bucket: `${config.bucket}`,
			Key: `${filepath}/${filename}`,
		},
	};
  console.log({ params });

	const result = await client.downloadFile(params);

	result.on('error', function (err) {
		console.error("-----unable to download:", err.stack);
	});
	result.on('progress', function () {
		console.log("-----progress", result.progressAmount, result.progressTotal);
	});
	result.on('end', function () {
		console.log("-----download done");
	});
};

const PATH = `storage/5dfe4c1b51dc622100bb9d8f/5e60dffb2c43a444c5f8e227/5e61c90b35806b71d29d8d9a`;
downloadFileS3('87cf8bf00caf66491c219d4f3ab35ae0.PNG', PATH)

// s3.listBuckets((error, data) => {
//   if(error) return console.error(error);

//   const bucketMain = data.Buckets.find(b => b.Name === config.bucket);
//   const PATH = `root/storage/5dfe4c1b51dc622100bb9d8f/5e60dffb2c43a444c5f8e227/5e61c90b35806b71d29d8d9a/`;

//   if(bucketMain) {
//     const params = {
//       Bucket: `${bucketMain.Name}`,
//       // Bucket: `${bucketMain.Name}/${PATH}`,
//       // Key: `87cf8bf00caf66491c219d4f3ab35ae0.PNG`
//     }
//     console.log({ params });

//     s3.listObjects(params, (err, data) => {
//       console.log({ err, data });
//       data.Contents.map(file => {
//         console.log({ file });
//       })
//     })
//   }
// })

