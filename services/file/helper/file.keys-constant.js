//FILE CONFIG || VARIABLE CONSTANT
exports.FILE_PROCESSING            = 0;
exports.FILE_UPLOAD_ERROR          = -1;
exports.FILE_UPLOAD_SUCCESS        = 1;

exports.config = {
    aws_access_key_id       : process.env.AWS_ACCESS_KEY || "",
    aws_secret_access_key   : process.env.AWS_SECRET_KEY || "",
    aws_region              : process.env.AWS_REGION     || "ap-southeast-1",
    bucket                  : process.env.AWS_BUCKET     || "trx-demo-003",
    signedUrlExpireSeconds  : 60000
}