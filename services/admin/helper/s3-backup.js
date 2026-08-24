/**
 * CỬA ĐỌC KHO SAO LƯU — client S3 RIÊNG, không dùng chung với kho tệp người dùng.
 *
 * ⚠️ VÌ SAO KHÔNG TÁI DÙNG `tools/s3` HAY `services/file/helper/s3`.
 *
 * Hai chỗ đó cầm khoá `AWS_ACCESS_KEY_ID` của kho `trx-main` — khoá **ghi**, dùng cho tệp
 * người dùng tải lên. Kho sao lưu là thứ khác hẳn: nó chứa toàn bộ CSDL, và một khoá ghi
 * chạm được vào đó thì **xoá được cả kho sao lưu**. Đúng lúc cần khôi phục nhất là lúc không
 * còn gì để khôi phục.
 *
 * Nên: bộ biến `BACKUP_S3_*` riêng, khoá chỉ có quyền ĐỌC đúng một kho. Cùng cách hệ S7 đã
 * tách (`BACKUP_S3_*` vs `S3_*`).
 *
 * ⚠️ `endpoint` đọc từ biến môi trường, KHÔNG viết cứng như `tools/s3/index.js:23`. Kho sao lưu
 * có thể phải dời vùng hoặc dời tài khoản mà không sửa mã — đó chính là việc đã xảy ra với S7
 * (đổi kho `s7-prod-backup` ở tài khoản này sang `s7-hub-backup` ở tài khoản khác).
 */
const KHUON_TEN_TEP = /^cbs_official-\d{8}-\d{6}\.archive\.gz$/;

/** Số giây link tải còn hiệu lực. Đủ để bấm và bắt đầu tải, không đủ để chuyền tay. */
const HAN_LINK_GIAY = 300;

const docCauHinh = () => ({
    endpoint  : process.env.BACKUP_S3_ENDPOINT,
    region    : process.env.BACKUP_S3_REGION || 'sgp1',
    bucket    : process.env.BACKUP_S3_BUCKET,
    accessKey : process.env.BACKUP_S3_ACCESS_KEY,
    secretKey : process.env.BACKUP_S3_SECRET_KEY,
});

/** Máy chủ đã được khai khoá kho sao lưu chưa. */
const daKhaiKhoa = (cfg) => Boolean(cfg.bucket && cfg.accessKey && cfg.secretKey);

/**
 * Dựng client S3 mới mỗi lần gọi.
 *
 * Không giữ sẵn một client dùng chung ở cấp module: hai endpoint này bị gọi vài lần một ngày,
 * nên không có gì để tối ưu — mà giữ sẵn thì lúc đổi khoá phải khởi động lại pod mới ăn.
 */
const dungClient = async (cfg) => {
    const { S3Client } = require('@aws-sdk/client-s3');
    return new S3Client({
        forcePathStyle: false,
        endpoint: cfg.endpoint,
        region: cfg.region,
        credentials: { accessKeyId: cfg.accessKey, secretAccessKey: cfg.secretKey },
    });
};

module.exports = { KHUON_TEN_TEP, HAN_LINK_GIAY, docCauHinh, daKhaiKhoa, dungClient };
