"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("pcm_file", {
    //________Công ty (lấy từ thông tin Task)
    company: {
        type:  Schema.Types.ObjectId,
        ref : 'company'
    },

    //________Dự án/phòng ban (lấy từ thông tin Task)
    project: {
        type: Schema.Types.ObjectId,
        ref: 'department'
    },
    
    //________Nhóm dữ liệu (lấy từ thông tin Task)
    group: {
        type: Schema.Types.ObjectId,
        ref: 'pcm_plan_group'
    },

    //________Hợp đồng (lấy từ thông tin Task)
    contract: {
        type: Schema.Types.ObjectId,
        ref: 'contract'
    },

    //________Công việc
    task: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_plan_task'
    },

    //________Bình luận (Convert data sẽ không có trường này)
    comment: {
        type    :  Schema.Types.ObjectId,
        ref     : 'pcm_comment'
    },

    //________File
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    },

    /**
     * 1. Hình ảnh
     * 2. Audio
     * 3. file
     * 4. Video
     */
    type: { 
        type: Number,
        default: 1
    },
    
    //_________Tên gốc(Đưa qua bảng phụ để truy vấn)
    nameOrg     : { type: String, require: true }, 

    //_________Tên sau khi convert uuidv1(Đưa qua bảng phụ để truy vấn)
    name        : { type: String, require: true }, 

    //_________Author(Đưa qua bảng phụ để truy vấn)
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
})