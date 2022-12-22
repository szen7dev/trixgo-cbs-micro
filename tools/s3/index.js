const fs            = require('fs');
const AWS           = require('aws-sdk');
const s3            = require('@auth0/s3');
const { config }    = require('./config');

AWS.config.update({
    accessKeyId: config.aws_access_key_id,
    secretAccessKey: config.aws_secret_access_key,
    region: config.aws_region,
})
const s3Object = new AWS.S3();

const s3Client = s3.createClient({
    maxAsyncS3: 20,     // this is the default
    s3RetryCount: 3,    // this is the default
    s3RetryDelay: 1000, // this is the default
    multipartUploadThreshold: 20971520, // this is the default (20 MB)
    multipartUploadSize: 15728640, // this is the default (15 MB)
    s3Options: {
        accessKeyId : config.aws_access_key_id,
        secretAccessKey : config.aws_secret_access_key,
        region: config.aws_region,
    },
});

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

const downloadFileS3 = async (pathDownload, fileName, filePath, fileNameLocal) => {
    return new Promise(async resolve => {
        const params = {
            localFile: `${pathDownload}/${fileNameLocal}`,
            s3Params: {
                Bucket: `${config.bucket}`,
                Key: `${filePath}/${fileName}`,
            },
        };

        const downloader = await s3Client.downloadFile(params);

        downloader.on('error', function(err) {
            console.error("-----unable to download:", err.stack);
            resolve({ error: true, message: 'cant_get_file' });
        });

        downloader.on('progress', function() {
            console.log("-----progress", downloader.progressAmount, downloader.progressTotal);
        });

        downloader.on('end', function() {
            console.log("-----download done");
            resolve({ error: false, message: 'download done' });
        });
    })
}

module.exports = {
    uploadFileS3,
    downloadFileS3
}