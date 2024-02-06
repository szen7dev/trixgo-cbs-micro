require('dotenv').config();

exports.config = {
    aws_access_key_id       : process.env.AWS_ACCESS_KEY || "AKIA5JR5UVVOMFMK7WHW",
    aws_secret_access_key   : process.env.AWS_SECRET_KEY || "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",
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "trx-demo-003",
    bucketDemo              : process.env.AWS_BUCKET_DEMO || "trx-demo-003",
    bucketPath              : process.env.AWS_BUCKET_PATH || 'root',
    signedUrlExpireSeconds  : 60000
}