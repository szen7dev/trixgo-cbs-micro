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
    //_________Loại hành động(1-Xem/2-Thêm/3-Sửa/4-Xóa) dùng để sau này truy vấn ai đã thêm/sửa/xoá trên 1 đối tượng
    type: {
        type: Number,
        default: 1
    },
    //_________Key để xử lý ngôn ngữ (services\notification\helper\notification.keys-constant.js)
    languageKey: {
        type: String 
    },  
    //_________Thực hiện trên collection nào(VD: pcm_plan_task, document ...)
    coll: {
        kind: String,
        item: { type: Schema.Types.ObjectId, refPath: 'coll.kind' }
    },
    //_________Nội dung (mô tả ngắn nội dung)
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