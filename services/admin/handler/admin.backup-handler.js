/**
 * TOOLS
 */
const { renderStatusCodeAndResponse }   = require('../../../tools/utils/status_code');

/**
 * MODELS
 */
const ADMIN__BACKUP_MODEL               = require('../model/admin.backup').MODEL;
const AUTH__APP_USER                    = require('../../auth/model/auth.app_users').MODEL;

/**
 * ⭐ Ứng dụng QUẢN TRỊ (`owner`). Quyền vào kho sao lưu bám theo quyền Admin của ứng dụng này.
 *
 * Cùng mã với `APP_ID.OWNER.id` phía giao diện (`src/apis/localdb/index.ts`). Viết thẳng ở đây
 * chứ không đưa vào biến môi trường, cùng cách các model `fin`/`crm` đã làm với ứng dụng của
 * chúng: mã ứng dụng là dữ liệu CỐ ĐỊNH của hệ, không phải tham số vận hành. Đưa vào env thì
 * khai sai một ký tự là mở quyền cho nhầm ứng dụng, mà không có gì báo.
 */
const APP_ID_OWNER = '61e04989fdebf77b072d1b10';

/**
 * ⛔ CHỐT QUYỀN — chỉ Admin ứng dụng Quản trị (`level == 0`).
 *
 * Trixgo KHÔNG có lớp gác kiểu `superAdmin` gắn trước cả nhóm route như hệ S7, nên chốt này
 * phải nằm trong TỪNG handler. Đó là chỗ dễ sót, nên hai handler dưới đây đều gọi nó ở dòng
 * đầu tiên — thêm handler thứ ba mà quên gọi là mở toang kho sao lưu.
 *
 * Vì sao chặt tới mức này: danh sách lộ **tên kho và nhịp sao lưu**, còn link tải cho ra
 * **toàn bộ cơ sở dữ liệu**. Thành viên thường của ứng dụng Quản trị cũng không được thấy.
 */
const chotQuyenAdmin = async (ctx) => {
    const { _id: userID } = ctx.meta.infoUser || {};
    if (!userID) return { error: true, message: 'permission_denied', keyError: 'permission_denied', status: 403 };

    const infoAppUser = await AUTH__APP_USER.checkPermissionsAccessApp({
        appID: APP_ID_OWNER,
        userID,
    });

    /* Kiểm `error` TRƯỚC khi chạm `.data` — khi không có quyền thì `data` không tồn tại, và
       đọc thẳng `infoAppUser.data.level` sẽ ném TypeError. Lỗi đó rơi vào khối catch rồi trả
       500 "Cannot read properties of undefined", tức là người bị từ chối quyền lại nhận được
       một thông báo nói rằng máy chủ hỏng. */
    if (!infoAppUser || infoAppUser.error || !infoAppUser.data)
        return { error: true, message: 'permission_denied', keyError: 'permission_denied', status: 403 };

    if (infoAppUser.data.level !== 0)
        return { error: true, message: 'permission_denied', keyError: 'permission_denied', status: 403 };

    return null;   // qua cửa
};

module.exports = {
    /**
     * Dev: HiepNH
     * Func: Danh sách bản sao lưu CSDL đang có trong kho
     * Date: 24/08/2026
     */
    getList: {
        auth: "required",
        async handler(ctx) {
            try {
                const tuChoi = await chotQuyenAdmin(ctx);
                if (tuChoi)
                    return renderStatusCodeAndResponse({ resultAfterCallHandler: tuChoi, ctx });

                const resultAfterCallHandler = await ADMIN__BACKUP_MODEL.getList();
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    /**
     * Dev: HiepNH
     * Func: Cấp link tải có hạn cho MỘT bản sao lưu
     * Date: 24/08/2026
     */
    getDownloadUrl: {
        auth: "required",
        params: {
            ten: { type: "string" },
        },
        async handler(ctx) {
            try {
                const tuChoi = await chotQuyenAdmin(ctx);
                if (tuChoi)
                    return renderStatusCodeAndResponse({ resultAfterCallHandler: tuChoi, ctx });

                const { _id: userID } = ctx.meta.infoUser;
                const { ten } = ctx.params;

                const resultAfterCallHandler = await ADMIN__BACKUP_MODEL.getDownloadUrl({ ten, userID });
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },
};
