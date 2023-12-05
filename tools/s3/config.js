exports.config = {
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "trx-demo-003",
    bucketDemo              : process.env.AWS_BUCKET_DEMO || "trx-demo-003",
    bucketPath              : process.env.AWS_BUCKET_PATH || 'root',
    signedUrlExpireSeconds  : 60000
}