"use strict";

"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * COLLECTION PHÂN QUYỀN TRUY CÂP NHÓM, CHỦ ĐỀ
 */

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_log", {
     /**
     * 1 Cập nhật thông tin công việc
     * 2 Gửi email thông báo nhắc nhở
     * 3 Thêm việc con
     * 4 Thêm Phản hồi liên quan
     * 5 Thêm Comment
     * 6 Thêm Hiện Trạng
     * 7 Thêm Giải Pháp
     * 8 Thêm Checklist
     * 9 Thêm người liên quan
     * 10 Tạo Task??? (đã có ở 3)
     * 11 Thêm File đính kèm
     * 12 Thêm việc liên quan
     * 13 Thêm file của người tạo việc
     * 14 Thêm file của người thực hiện
     * 15 Thêm file phản hồi liên quan (thêm bổ sung)
     * 16 Thêm file của comment (thêm bổ sung)
     * 17 Bấm hoàn thành checklist
     * 18 Ký xác nhận
     * 19 Phê duyệt
     * 20 Đánh giá công việc
     * 21 Thông báo Trixgo nhắc nhở
     * 22 Cập nhật trạng thái công việc
     * 23 Cập nhật tình trạng ưu tiên cho công việc
     * 24 Di chuyển công việc sang một nhóm khác
     * 25 Di chuyển công việc vào báo cáo
     * 26 Kích hoạt việc nháp thành việc chính
     */
      type: {
        type: Number,
        default: 1
    },
    /**
     * 1 Comment
     * 2 Hiện trạng
     * 3 Giải pháp
     * 4 Checklist
     * 5 Người liên quan
     * 6 Task
     * 7 File đính kèm
     */
    behavior: {
        type: Schema.Types.ObjectId,
    },
    task: {
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_task"  
    },
    /**
     * 1 Create
     * 2 Update
     * 3 Delete
     */
    action: {
        type: Number,
        default: 1                     
    },
    content: String,
    files: [
        {
            type: Schema.Types.ObjectId,
            ref : "file"  
        }
    ],
    usersSeen: [
        {
            type: Schema.Types.ObjectId,
            ref : "user"  
        }
    ],
    // 0 chưa xem 1 đã xem
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"     
    },
    beforeChange:{
        type: Schema.Types.ObjectId,
        ref : "pcm_plan_log" 
    }
});