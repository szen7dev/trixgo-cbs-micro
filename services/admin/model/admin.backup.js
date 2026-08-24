"use strict";
/**
 * KHO SAO LƯU — chỉ ĐỌC.
 *
 * Không có hàm xoá, và đó là chủ ý chứ không phải chưa làm tới: một nút xoá trên màn hình
 * quản trị chỉ tiết kiệm được vài giây so với `doctl`/bảng điều khiển DO, mà đổi lại là một
 * đường xoá sạch kho sao lưu chỉ bằng vài cú bấm. Vòng đời bản sao lưu đã do CronJob lo
 * (giữ 14 ngày trên Spaces), không cần người can thiệp.
 */
const {
    KHUON_TEN_TEP, HAN_LINK_GIAY, docCauHinh, daKhaiKhoa, dungClient,
} = require('../helper/s3-backup');

class Model {
    /**
     * Danh sách bản sao lưu, mới nhất đứng đầu.
     *
     * ⭐ BA TRẠNG THÁI TÁCH BẠCH, cố ý không gộp:
     *   · chưa khai khoá  → 200 kèm `configured: false`. KHÔNG phải lỗi máy chủ: môi trường
     *                       dev và staging không có kho sao lưu là chuyện bình thường, và trả
     *                       500 ở đó làm người ta đi sửa nhầm chỗ.
     *   · kho không đọc được → 502. Khoá sai, kho bị xoá, mạng chết — lỗi THẬT, phải kêu.
     *   · kho rỗng        → 200 kèm `items: []`. Đây là ca NGUY nhất và nó trông giống hệt ca
     *                       bình thường, nên tầng hiển thị phải nói ra (xem `OwnerBackupPage`).
     */
    getList() {
        return new Promise(async (resolve) => {
            const cfg = docCauHinh();

            if (!daKhaiKhoa(cfg)) {
                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        configured: false,
                        bucket: null,
                        items: [],
                        total: 0,
                        message: 'Chưa khai khoá kho sao lưu (BACKUP_S3_*) cho máy chủ này.',
                    },
                });
            }

            try {
                const { ListObjectsV2Command } = require('@aws-sdk/client-s3');
                const s3 = await dungClient(cfg);

                /* MaxKeys 100: kho giữ 14 ngày nên thực tế có ~14 tệp. Đặt trần để một kho bị
                   cấu hình sai (trỏ nhầm sang kho tệp người dùng hàng chục nghìn object) không
                   kéo cả trang chết đứng. */
                const out = await s3.send(new ListObjectsV2Command({
                    Bucket: cfg.bucket,
                    MaxKeys: 100,
                }));

                const items = (out.Contents || [])
                    .map((o) => ({ name: o.Key, size: o.Size, at: o.LastModified }))
                    .sort((a, b) => new Date(b.at) - new Date(a.at));

                return resolve({
                    error: false,
                    status: 200,
                    data: { configured: true, bucket: cfg.bucket, items, total: items.length },
                });
            } catch (error) {
                console.error('[admin/backups]', error.message);
                return resolve({
                    error: true,
                    message: 'Không đọc được kho sao lưu: ' + error.message,
                    keyError: 'backup_store_unreachable',
                    status: 502,
                });
            }
        });
    }

    /**
     * Cấp link tải có hạn cho MỘT bản sao lưu.
     *
     * ⭐ KHÔNG stream tệp qua máy chủ ứng dụng. Bản sao lưu Trixgo nặng ~1,1 GB; đẩy nó qua
     * pod API là giữ một kết nối hàng phút, ăn băng thông của mọi request khác, và pod bị
     * khởi động lại giữa chừng là hỏng cả lượt tải. Link ký sẵn cho trình duyệt tải THẲNG từ
     * Spaces — máy chủ chỉ làm đúng việc cấp phép.
     *
     * ⭐ Lọc tên tệp bằng DANH SÁCH TRẮNG theo khuôn, không phải bằng cách chặn "../".
     * Chặn theo mẫu xấu là trò đuổi bắt không bao giờ thắng; chỉ nhận đúng khuôn tên mà
     * CronJob sinh ra thì mọi thứ khác rơi ra ngoài, kể cả những dạng chưa ai nghĩ tới.
     */
    getDownloadUrl({ ten, userID }) {
        return new Promise(async (resolve) => {
            if (!KHUON_TEN_TEP.test(String(ten || ''))) {
                return resolve({
                    error: true,
                    message: 'Tên tệp không hợp lệ.',
                    keyError: 'params_invalid',
                    status: 400,
                });
            }

            const cfg = docCauHinh();
            if (!daKhaiKhoa(cfg)) {
                return resolve({
                    error: true,
                    message: 'Chưa khai khoá kho sao lưu.',
                    keyError: 'backup_not_configured',
                    status: 409,
                });
            }

            try {
                const { GetObjectCommand } = require('@aws-sdk/client-s3');
                const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
                const s3 = await dungClient(cfg);

                const url = await getSignedUrl(
                    s3,
                    new GetObjectCommand({
                        Bucket: cfg.bucket,
                        Key: ten,
                        ResponseContentDisposition:
                            `attachment; filename*=UTF-8''${encodeURIComponent(ten)}`,
                    }),
                    { expiresIn: HAN_LINK_GIAY },
                );

                /* Dấu vết ghi ra NHẬT KÝ MÁY CHỦ, không ghi vào CSDL — cùng lựa chọn của S7.
                   Ghi vào CSDL thì bản ghi đó nằm trong chính cái CSDL vừa bị tải về, và người
                   tải là người có quyền cao nhất hệ thống. Nhật ký pod thì gom ra ngoài. */
                console.warn(`[TẢI BẢN SAO LƯU] user=${userID} tệp=${ten} lúc=${new Date().toISOString()}`);

                return resolve({
                    error: false,
                    status: 200,
                    data: { url, expires_in_s: HAN_LINK_GIAY },
                });
            } catch (error) {
                console.error('[admin/backups/url]', error.message);
                return resolve({
                    error: true,
                    message: 'Không cấp được link tải: ' + error.message,
                    keyError: 'backup_store_unreachable',
                    status: 502,
                });
            }
        });
    }
}

exports.MODEL = new Model;
