"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_plan_task_file", {
    //________Công ty
    company: {
        type:  Schema.Types.ObjectId,
        ref : 'company'
    },

    //________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'deparment'
    },

    //________Nhóm dữ liệu
    planGroup: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_group'
    },

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
        ref     : 'file'
    },
    
    //________Người khởi tạo
    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    }
})