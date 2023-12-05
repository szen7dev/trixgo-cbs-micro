// const fs    = require('node:fs');
const fs    = require('fs');
// const stream = require('node:stream');
const stream = require('stream');
// const path = require('node:path');
const path = require('path');
const uuidv4  = require('uuid').v4;
const AWS   = require('aws-sdk');
const s3 = require('@auth0/s3');
const archiver = require('archiver');
const PromisePool = require('@supercharge/promise-pool');

const OBJECT_KEYS = [
  {
      "_id": "6360a2d2a883616a9209e7fb",
      "nameOrg": "01112022-WIR-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/01112022-WIR-01.pdf___12cb5479-057e-4119-be8c-9b5e373012c3___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "6360dc9ea883616a9209e9e4",
      "nameOrg": "01112022-WIR-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/01112022-WIR-01.pdf___62a04c58-c40e-4cfa-9a30-37f7646816a3___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "6361c1d69def713ec3c6e4ec",
      "nameOrg": "02112022-WIR-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/02112022-WIR-01.pdf___8b8ccab8-49da-4382-9249-848f9eb84e8c___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "63621be83de4597d29209f1a",
      "nameOrg": "02112022-MSM-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/02112022-MSM-01.pdf___52344be9-a1bd-4d2f-982c-04a9b12f4ad5___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "63621f703de4597d29209f44",
      "nameOrg": "FP3-MOS-IBS-LIG-20221102_ BBHT Vv nghiệm thu trắc đạc trước khi triển khai cọc đại trà.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/FP3-MOS-IBS-LIG-20221102_ BBHT Vv nghiem thu trac dac truoc khi trien khai coc dai tra.pdf___6fe3db61-a837-4860-898a-77a26fdad793___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "636393093de4597d2920a820",
      "nameOrg": "031122-MSM-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/031122-MSM-01.pdf___5ad57bb5-42e7-4cec-a48a-1290101c0132___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "63639a5c3de4597d2920a878",
      "nameOrg": "031122-LIG-ITP-01.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/031122-LIG-ITP-01.pdf___c726249e-f038-4349-a1b2-bd1283b63e83___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "6364b41e86332a2dcfd3e87b",
      "nameOrg": "041122-LIG-ITP-02.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/041122-LIG-ITP-02.pdf___989691f2-8242-429d-9514-1907fa2932d3___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "63664fcbe6a0f32bfc18e532",
      "nameOrg": "051122-ITP-03-Ống SÂ.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/051122-ITP-03-Ống SA.pdf___0f3d20ac-021c-4e98-bc1e-f36d6145b493___PCM_PLAN_TASK.pdf"
  },
  {
      "_id": "636795dae6a0f32bfc18e763",
      "nameOrg": "061122-ITP-03-Thép ống.pdf",
      "path": "/root/storage/5dfe4b9051dc622100bb9d89/6046ac97b55525368b105d62/633c0c684a8b661cf2034aeb/63497de6b67a820599814258/061122-ITP-03-Thep ong.pdf___18c168c3-1447-4817-ba6a-a48303991c1f___PCM_PLAN_TASK.pdf"
  }
];

const config = {
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "trx-main", // trx-demo-003
    bucketDemo              : process.env.AWS_BUCKET_DEMO || "trx-demo-003",
    signedUrlExpireSeconds  : 60000
}

AWS.config.update({
    region: config.aws_region,
    signatureVersion: 'v4',
})
const s3Object = new AWS.S3();

const s3Client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
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

const uploadFileS3 = async () => {
  const archiveStream = archiver('zip');

  archiveStream.on('error', (error) => {
      console.error('Archival encountered an error:', error)
      throw new Error(error)
  })

  const passThrough = new stream.PassThrough();

  const bucket = `${config.bucketDemo}/files/temp`;

  const params = {
      Bucket: bucket,
      ACL: 'public-read',
      Key: `${uuidv4()}-${Date.now()}__demo.zip`, // File name you want to save as in S3
      Body: passThrough,
      ContentType: 'application/zip',
  };

  s3Object.upload(params, function(err, data) {
      if (err) throw err;

      console.log(`File uploaded successfully. ${data.Location}`);
  });

  archiveStream.pipe(passThrough);

  const { results, errors } = await PromisePool
    .for(OBJECT_KEYS)
    .withConcurrency(5)
    .process(async file => {
      const splits = file.path.split('/');
      const fileName = splits.pop();
      const filePath = splits.join('/').slice(1);

      const params = {
        Bucket: config.bucket,
        Key: `${filePath}/${fileName}`,
      };

      const response = await s3Object.getObject(params).promise();
      console.log({ response, params, basename: path.basename(file.path) })

      archiveStream.append(response.Body, { name: path.basename(file.path) })
      return response;
    })

  console.log({ results, errors })

  archiveStream.finalize();
}

uploadFileS3();

// const PATH = `storage/5dfe4c1b51dc622100bb9d8f/5e60dffb2c43a444c5f8e227/5e61c90b35806b71d29d8d9a`;
// downloadFileS3('87cf8bf00caf66491c219d4f3ab35ae0.PNG', PATH)

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

