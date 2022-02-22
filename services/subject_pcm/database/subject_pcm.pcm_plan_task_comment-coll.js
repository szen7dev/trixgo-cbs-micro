"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task_comment", {
    //_________Nội dung
    content: String,
    /**
     * Phân loại
     * 1-Comment thông thường (task, document, post,...)
     * 2-Phản hồi liên quan (task)
     * 3-Hiện trạng (task)
     * 4-Giải pháp (task)
     */
    type: { type: Number, default: 1 },

    //_________Đánh dấu
    isMarked: { type: Boolean, default: false },

    //_________taskID
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },

    //_________ID comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task_comment'
    },

    //_________ID comment core
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    },
    
    //_________ID reply của comment reply cuối(Chi lưu cho comment cha)
    lastestReplyID: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task_comment'
    },
    
    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
}) 