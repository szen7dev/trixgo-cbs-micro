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
        /**
         * DO Spaces trả 503 SlowDown khi bị bắn quá nhanh. Chế độ adaptive tự hạ
         * nhịp phía client thay vì bỏ cuộc — không có nó, một cú SlowDown khi
         * ĐANG LIỆT KÊ sẽ giết cả lượt quét và để lại object vẫn public.
         */
        retryMode: "adaptive",
        maxAttempts: 10,
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
    const stubborn = new Set(); // key đặt private không thành, thử lại ở cuối

    const setPrivate = async (key) => {
        await client.send(new PutObjectAclCommand({
            Bucket: bucket,
            Key: key,
            ACL: "private",
        }));
    }

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
                        await setPrivate(object.Key);
                        updated++;
                        if (args.verbose) console.log(`  private  ${object.Key}`);
                    } catch (error) {
                        // Ghi lại để thử lại ở cuối — bỏ qua là để object vẫn public
                        stubborn.add(object.Key);
                        console.error(`  LỖI      ${object.Key}: ${error.message}`);
                    }
                }));
            }
        } else if (args.verbose) {
            contents.forEach(object => console.log(`  (dry)    ${object.Key}`));
        }

        continuationToken = listed.IsTruncated ? listed.NextContinuationToken : undefined;
        console.log(`Đã quét ${scanned} object | đã đặt private ${updated} | chờ thử lại ${stubborn.size}`);
    } while (continuationToken);

    // Vòng thử lại: object nào vẫn hỏng sau các lượt này mới thật sự là thất bại
    for (let round = 1; round <= 3 && stubborn.size > 0; round++) {
        const keys = [...stubborn];
        console.log(`Thử lại lượt ${round} cho ${keys.length} object...`);

        for (let i = 0; i < keys.length; i += args.concurrency) {
            await Promise.all(keys.slice(i, i + args.concurrency).map(async key => {
                try {
                    await setPrivate(key);
                    stubborn.delete(key);
                    updated++;
                } catch (error) {
                    console.error(`  VẪN LỖI  ${key}: ${error.message}`);
                }
            }));
        }
    }

    console.log("--------------------------------------------------");
    console.log(`XONG. Tổng quét ${scanned}, đặt private ${updated}, còn lỗi ${stubborn.size}.`);

    if (stubborn.size > 0) {
        console.error("Các key CHƯA khoá được (vẫn đang public):");
        [...stubborn].slice(0, 50).forEach(k => console.error(`  ${k}`));
        process.exit(1);
    }
}

run().catch(error => {
    console.error("Script hỏng:", error);
    process.exit(1);
});
