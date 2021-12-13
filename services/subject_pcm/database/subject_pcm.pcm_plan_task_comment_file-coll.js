"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task_comment_file", {
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task_comment'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    }
})