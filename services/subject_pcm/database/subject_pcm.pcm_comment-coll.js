"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_comment", {
    //_________taskID
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },
    //_________Nội dung
    content: String,

    //_________ID comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_comment'
    },
    /**
     * Phân loại
     * 1-Comment thông thường (task, document, post,...)
     * 2-Phản hồi liên quan (task)
     * 3-Hiện trạng (task)
     * 4-Giải pháp (task)
     */
    type: { type: Number, default: 1 },

    /**
     * Phân loại công việc(ispropsal) PCM_PROPOSAL_TASK trong cf_constant
     */
    subType:{ type: Number, default: 0 },

    //_________Đánh dấu(Minh thay isMarked = official)
    official: { type: Boolean, default: false },

    //_________File đính kèm
    files: [{
        type: Schema.Types.ObjectId,
        ref : "file"
    }],
    
    //_________ID reply của comment reply cuối(Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_comment'
    },


    //_________Người tạo comment
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },

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

    //_________1 mảng loại cảm xúc để show trên view
    typeReactions: [{
        type :  Number,
    }],

    //_________Người được tag vào comment
    tag: [{
        type: Schema.Types.ObjectId,
        ref : "user"
    }],

    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
}) 