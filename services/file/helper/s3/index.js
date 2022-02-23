let { config } = require('../file.keys-constant');
let AWS        = require('aws-sdk');

AWS.config.update({
    accessKeyId : config.aws_access_key_id,
    secretAccessKey : config.aws_secret_access_key,
    region: config.aws_region,
})
let s3Object                    = new AWS.S3();

// link từ s3 upload file
let render_link_upload_file_s3 = ({ fileName, type, typeUpload }) =>{
    try {
        let bucket = `${config.bucket}${process.env.AWS_BUCKET_PATH || '/root/test'}`;

        //_____upload avatar user
        if(typeUpload == "user"){
            bucket = `${config.bucket}/files/db/users`
        }
        console.log({ bucket, fileName, type, config })

        let url = s3Object.getSignedUrl('putObject', {
            Bucket: bucket,
            Key: fileName,
            Expires: config.signedUrlExpireSeconds,
            ACL: "public-read",
            ContentType: type,
        });
        console.log({ url })
        return url;
    } catch (error) {
        return { error: true, message: "Can't presign url" }
    }
}

function render_link_upload_s3(fileName, type, typeUpload) {
    return new Promise(async resolve => {
        try {
            if(!fileName || !type)
                return resolve({ error: true, message: "params_invalid" });
            let result = await render_link_upload_file_s3({ fileName, type, typeUpload });
            if(!result.error){
                return resolve({ error: false, data: result, fileName });
            }else{
                return resolve({ error: true, message: "Error" });
            }
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })
}

const uploadFile = (pathFile, key) => {
    return new Promise( resolve => {
        try {
            // Read content from the file
            // const fileContent = fs.readFileSync(pathFile);

            const parseBase64ToBuffer = Buffer.from(pathFile.replace(/^data:image\/\w+;base64,/, ""), 'base64');
            const bucket = `${config.bucket}/root`;

            // Setting up S3 upload parameters
            const params = {
                ContentEncoding: 'base64',
                ContentType: 'image/jpeg',
                ACL:'public-read',
                Bucket: bucket,
                Key: key,
                Body: parseBase64ToBuffer
            };

            // Uploading files to the bucket
            const result = s3Object.upload(params, function(err) {
                if (err) throw err;
            });

            return resolve({ error: false, data: result });
        } catch (error) {
            return resolve({ error: true, message: error.message });
        }
    })

};

exports.GENERATE_LINK_S3 = render_link_upload_s3;
exports.UPLOAD_FILE_S3   = uploadFile;
