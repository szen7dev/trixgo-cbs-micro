"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_file", {
    //________Công ty
    company: {
        type:  Schema.Types.ObjectId,
        ref : 'company'
    },

    //________Dự án/phòng ban
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
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
        ref     : 'pcm_comment'
    },

    //________File
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    },
    
    //_________Tên gốc(Đưa qua bảng phụ để truy vấn)
    nameOrg     : { type: String, require: true }, 

    //_________Tên sau khi convert uuidv1(Đưa qua bảng phụ để truy vấn)
    name        : { type: String, require: true }, 

    //_________Author(Đưa qua bảng phụ để truy vấn)
    author: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
})