"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_comment", {
    //_________Mã hiệu bằng số do hệ thống tự phát sinh
    suid : {
        type   : String,
        require:  true,
        unique : true
    },
    //_________Người tạo comment
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
    //_________Công ty của người tạo comment
    companyOfAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Người nhận
    receiver: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],

    //________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },

    //________Nhóm dữ liệu
    group: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_group'
    },

    //_________contractID
    contract: {
        type    :  Schema.Types.ObjectId,
        ref     : 'contract'
    },

    //_________taskID
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },

    //_________ID comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_comment'
    },

    //_________ID reply của comment reply cuối (Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_comment'
    },

    //_________Nội dung
    content: String,

    //_________Nội dung convert
    contentcv: String,

    /**
     * Phân loại
     * 1-Comment thông thường (task, project, document,...)
     * 2-Phản hồi liên quan (task, project)
     * 3-Hiện trạng (task)
     * 4-Giải pháp (task)
     * 5-Mặc định tạo kèm khi tạo việc/mô tả công việc
     */
    type: { type: Number, default: 1 },

    /**
     * Phân loại công việc(ispropsal) PCM_PROPOSAL_TASK trong cf_constant
     */
    subType:{ type: Number, default: 0 },

    //_________Đánh dấu chính thức
    official: { type: Boolean, default: false },

    //_________File đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref : "file"
    }],

    //_________Các ảnh được đính kèm trong bài viết
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],

    //_________Số lượng comment con của comment cha
    amountCommentReply: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng reaction con của comment cha
    amountReaction: {
        type    :  Number,
        default : 0
    },

    //_________Người cập nhật comment
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})