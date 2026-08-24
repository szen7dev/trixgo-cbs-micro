const BASE_ROUTE = '/admin';

/**
 * Cụm QUẢN TRỊ HỆ THỐNG — chỉ Admin ứng dụng (level 0) gọi được.
 *
 * Tách khỏi `/files` một cách CỐ Ý: `/files` là kho tệp của người dùng, còn đây là kho SAO LƯU
 * cả cơ sở dữ liệu. Hai kho khác nhau, hai khoá khác nhau, và ranh giới đó phải nhìn thấy được
 * ngay từ đường dẫn.
 */
const CF_ROUTINGS_ADMIN = {
    ORIGIN_APP: BASE_ROUTE,

    /** Danh sách bản sao lưu đang có trong kho. */
    BACKUPS             : `${BASE_ROUTE}/backups`,
    /** Cấp link tải có hạn cho MỘT bản sao lưu. Không trả nội dung tệp. */
    BACKUP_DOWNLOAD_URL : `${BASE_ROUTE}/backups/:ten/url`,
}

exports.CF_ROUTINGS_ADMIN = CF_ROUTINGS_ADMIN;
