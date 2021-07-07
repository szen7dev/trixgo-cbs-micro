"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("message_message", {

    /**
     *  Người gửi tin nhắn
     */
    sender: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },

    /**
     * Người nhận tin nhắn
     */
    receivers:[{
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    }],

    /**
     * Nội dung của tin nhắn
     */
    content: {
        type: String
    },
    
    /**
     * Các files được đính kèm trong cuộc hội thoại
     */
    files: [{
        type    : Schema.Types.ObjectId,
        ref     : 'file'
    }],

    /**
     * Tin nhắn thuộc cuộc hội thoại
     */
    conversation: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },

    /**
     * Tin nhắn được trích dẫn
     */
    parent: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_message'
    },

    /**
     * Trạng thái của tin nhắn
     * 0 : đã gửi nhưng chưa xem/ chưa nhận))  
     * 1 : đã xem
     * 2 : đã nhận
     * 3 : tin nhắn được chia sẽ
    */
    status: {
        type   : Number,
        default: 0
    },
   /**
     * Loại tin nhắn
     * 0: tin nhắn thông thường 
     * 1: Thêm người mới vào cuộc hội thoại
     * 2: Xóa người khỏi cuộc hội thoại
     * 3: Đổi tên cuộc hội thoại
     * 4: Đổi logo cuộc hội thoại
     * 5: Thêm admin mới cho cuộc hội thoại
     * 6: Xóa cuộc hội thoại
     * 7: Xóa admin
     * 8: là gửi nút like
     */
    type: {
        type   : Number,
        default: 0
    },

    /**
     * vinhnh
     * Đã xem
     * Danh sách user đã xem tinh nhắn này
     * xác định đã xem thông qua số lượng listSeen
     * không cần dùng đến trường status
     */
    listSeen : [{
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }],

    /**
     * Thông tin về reaction
     */
    reactions : [{
        type    : Schema.Types.ObjectId,
        ref     : 'reaction'
    }],

    /**
     * QUẢN LÝ TICKET/BUG
     */
    /**
     * Phân loại Bug/Ticket cần support
     * 0: Không phải là bug
     * 1: Là bug cần được TrixGo xử lý/Support ticket
     * 2: Là tính năng cần được cải thiện
     * 3: Là giao việc qua PCM
     */
    // bug: {
    //     type   : Number,
    //     default: 0
    // },

    // //_______Liên quan tới ứng dụng nào
    // app: {
    //     type    :  Schema.Types.ObjectId,
    //     ref     : 'app'
    // },
    
    // /**
    //  * Số hiệu của Bug để dễ nhận biết sau này
    //  * Được tính bằng giá trị lớn nhất hiện tại của hệ thống + 1
    //  */
    // ticket: {
    //     type   : Number,
    //     default: 0
    // },

    // /**
    //  * Mức độ ưu tiên cần xử lý
    //  * 1-Cao (Hotfix)
    //  * 2-Bình thường
    //  * 3-Thấp
    //  */
    // priority: {
    //     type   : Number,
    //     default: 2
    // },

    // //_________Dự kiến thời gian hoàn tất fixBug
    // expiredTime: { type: Date, default: null },

    // /**
    //  * Trạng thái của bug
    //  * 0: Chưa xử lý
    //  * 1: Đã xử lý
    //  */
    // fixedbug: {
    //     type   : Number,
    //     default: 0
    // },

    // /**
    //  * Người dự kiến thực hiện fixbug (khi lập kế hoạch)
    //  * Người đã fixbug: người tích hoàn tất (có thể là BA)
    //  */
    // userFixedBug: {
    //     type    :  Schema.Types.ObjectId,
    //     ref     : 'user'
    // },

    // //_________Thời gian xong fixbug
    // fixBugAt: {
    //     type : Date
    // },

    /**
     * QUẢN LÝ GIAO VIỆC QUA PCM
     * Sử dụng để get link tới công việc bên PCM
     */
    task: {
        type    : Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },

    //_________Các chi chú nếu có
    // noteBug: String
})