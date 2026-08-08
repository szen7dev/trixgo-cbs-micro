#!/usr/bin/env node
"use strict";

/**
 * GỠ QUYỀN PUBLIC CỦA CÁC OBJECT ĐANG NẰM TRONG BUCKET
 * ------------------------------------------------------------------
 * Code mới không còn gắn ACL public-read khi upload, nhưng toàn bộ file cũ
 * vẫn đang public. Script này duyệt bucket và đặt lại ACL private cho từng object.
 *
 * Cách chạy (cần AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY / AWS_BUCKET trong env):
 *
 *   node tools/s3/set-private.js --dry-run                  # chỉ đếm, không sửa
 *   node tools/s3/set-private.js --prefix files/db/users/   # chạy thử 1 nhánh
 *   node tools/s3/set-private.js                            # chạy toàn bucket
 *
 * Tuỳ chọn:
 *   --prefix <p>        chỉ xử lý object có key bắt đầu bằng p
 *   --concurrency <n>   số object xử lý song song (mặc định 20)
 *   --dry-run           liệt kê chứ không đổi ACL
 *   --verbose           in từng key
 *
 * Script chạy lại được nhiều lần, object đã private thì đặt lại cũng vô hại.
 */

require("dotenv").config();

const {
    S3Client,
    ListObjectsV2Command,
    PutObjectAclCommand,
} = require("@aws-sdk/client-s3");

const { config } = require("./config");

const parseArgs = (argv) => {
    const args = { prefix: "", concurrency: 20, dryRun: false, verbose: false };

    for (let i = 0; i < argv.length; i++) {
        switch (argv[i]) {
            case "--prefix":
                args.prefix = argv[++i] || "";
                break;
            case "--concurrency":
                args.concurrency = Number(argv[++i]) || 20;
                break;
            case "--dry-run":
                args.dryRun = true;
                break;
            case "--verbose":
                args.verbose = true;
                break;
            default:
                break;
        }
    }

    return args;
}

const run = async () => {
    const args = parseArgs(process.argv.slice(2));
    const bucket = config.bucket;

    if (!config.aws_access_key_id || !config.aws_secret_access_key) {
        console.error("Thiếu AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY trong env.");
        process.exit(1);
    }

    const client = new S3Client({
        forcePathStyle: false,
        endpoint: process.env.AWS_ENDPOINT_URL_S3 || "https://sgp1.digitaloceanspaces.com",
        region: "sgp1",
        credentials: {
            accessKeyId: config.aws_access_key_id,
            secretAccessKey: config.aws_secret_access_key,
        },
    });

    console.log(`Bucket    : ${bucket}`);
    console.log(`Prefix    : ${args.prefix || "(toàn bộ)"}`);
    console.log(`Chế độ    : ${args.dryRun ? "DRY-RUN (không sửa gì)" : "ĐẶT PRIVATE"}`);
    console.log("--------------------------------------------------");

    let continuationToken;
    let scanned = 0;
    let updated = 0;
    let failed = 0;

    do {
        const listed = await client.send(new ListObjectsV2Command({
            Bucket: bucket,
            Prefix: args.prefix || undefined,
            ContinuationToken: continuationToken,
        }));

        const contents = listed.Contents || [];
        scanned += contents.length;

        if (!args.dryRun) {
            // Xử lý theo lô để không bắn quá nhiều request cùng lúc
            for (let i = 0; i < contents.length; i += args.concurrency) {
                const batch = contents.slice(i, i + args.concurrency);

                await Promise.all(batch.map(async object => {
                    try {
                        await client.send(new PutObjectAclCommand({
                            Bucket: bucket,
                            Key: object.Key,
                            ACL: "private",
                        }));
                        updated++;
                        if (args.verbose) console.log(`  private  ${object.Key}`);
                    } catch (error) {
                        failed++;
                        console.error(`  LỖI      ${object.Key}: ${error.message}`);
                    }
                }));
            }
        } else if (args.verbose) {
            contents.forEach(object => console.log(`  (dry)    ${object.Key}`));
        }

        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
        console.log(`Đã quét ${scanned} object | đã đặt private ${updated} | lỗi ${failed}`);
    } while (continuationToken);

    console.log("--------------------------------------------------");
    console.log(`XONG. Tổng quét ${scanned}, đặt private ${updated}, lỗi ${failed}.`);

    if (failed > 0) process.exit(1);
}

run().catch(error => {
    console.error("Script hỏng:", error);
    process.exit(1);
});
