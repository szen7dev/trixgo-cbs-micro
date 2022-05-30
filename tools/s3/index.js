const fs = require('fs');
const AWS = require('aws-sdk');
const { config } = require('./config');

AWS.config.update({
    accessKeyId: config.aws_access_key_id,
    secretAccessKey: config.aws_secret_access_key,
    region: config.aws_region,
})
const s3Object = new AWS.S3();

const uploadFileS3 = (pathFile, key) => {
    return new Promise(async resolve => {
        const fileContent = fs.readFileSync(pathFile);
        const bucket = `${process.env.AWS_BUCKET_DEMO}/files/temporary_uploads`;

        // Setting up S3 upload parameters
        const params = {
            Bucket: bucket,
            ACL: 'public-read',
            Key: key, // File name you want to save as in S3
            Body: fileContent,
            // ContentType: 'application/vnd.ms-excel.sheet.macroEnabled.12',
            // Expires: config.signedUrlExpireSeconds,
        };

        // Uploading files to the bucket
        s3Object.upload(params, function(err, data) {
            if (err) throw err;

            console.log(`File uploaded successfully. ${data.Location}`);
            resolve(data);
        });
    })
}

module.exports = {
    uploadFileS3
}