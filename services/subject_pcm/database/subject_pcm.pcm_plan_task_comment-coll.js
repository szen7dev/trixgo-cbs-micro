"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task_comment", {
    /**
     * Phân loại
     * 1-Comment thông thường (task, document, post,...)
     * 2-Phản hồi liên quan (task)
     * 3-Hiện trạng (task)
     * 4-Giải pháp (task)
     */
    type: { type: Number, default: 1 },
    
    //_________templateID
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },
    //_________ID comment core
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'comment_core'
    },
    //_________ID comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task_comment'
    },

    //_________ID file đính kèm
    files: [
        {
            type    :  Schema.Types.ObjectId,
            ref     : 'file_core'
        }
    ],
    //_________Số lượng comment con
    amountChilds: {
        type: Number,
        default: 0
    },
    //_________Số lượng reaction
    amountReactions: {
        type: Number,
        default: 0
    },
}) 