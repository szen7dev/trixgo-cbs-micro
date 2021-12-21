"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task_comment_file", {
    //________Công việc
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },
    //________Bình luận
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task_comment'
    },
    //________File
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    }
})