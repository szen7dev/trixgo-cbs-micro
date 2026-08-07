require("dotenv").config();

exports.config = {
  aws_access_key_id: process.env.AWS_ACCESS_KEY_ID || "",
  aws_secret_access_key: process.env.AWS_SECRET_ACCESS_KEY || "",
  aws_region: process.env.AWS_REGION || "ap-southeast-1",
  bucket: process.env.AWS_BUCKET || "trx-demo-003",
  bucketDemo: process.env.AWS_BUCKET_DEMO || "trx-demo-003",
  bucketPath: process.env.AWS_BUCKET_PATH || "root",
  // Hạn của link ký để UPLOAD (PUT)
  signedUrlExpireSeconds: 60000,
  // Hạn của link ký để ĐỌC (GET) — gateway cấp sau khi user đã đăng nhập
  signedDownloadExpireSeconds: Number(process.env.AWS_SIGNED_DOWNLOAD_EXPIRE_SECONDS || 300),
};

