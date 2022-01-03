"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("history_log", {
    //_______Dự án (option, chỉ khi truy cập vào project thì mới có trường này)
    project: {
        type: Schema.Types.ObjectId,
        ref : 'department' 
    },

    //_______Hợp đồng (option, chỉ khi truy cập vào contract thì mới có trường này)
    contract: {
        type: Schema.Types.ObjectId,
        ref : 'contract' 
    },
        
    //_________Loại hành động(1-Xem/2-Thêm/3-Sửa/4-Xóa) thay bằng collection
    type: {
        type: Number,
        default: 1
    },
    
    //_________Thực hiện trên collection nào(VD: Pcm_plan_task, Docs ...)
    parentCollection: {
        kind: String,
        item: { type: Schema.Types.ObjectId, refPath: 'parentCollection.kind' }
    },

    //_________Tác động đến gì(VD: Comment, Phản hồi liên quan)
    subCollection: {
        kind: String,
        item: { type: Schema.Types.ObjectId, refPath: 'subCollection.kind' }
    },

    //_________Nội dung thực thi hành động vd: Phan Văn Đệ-TRX đã xóa bình luận "Bạn bị làm sao í"
    content: String,

    //_________Công ty của người thực thi hành động
    companyOfAuthor: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },

    //_________User thực thi hành động
    userCreate: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },
})   