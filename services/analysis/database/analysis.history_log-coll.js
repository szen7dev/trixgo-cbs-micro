"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("history_log", {
    
    //_________Loại hành động(1-Xem/2-Thêm/3-Sửa/4-Xóa) thay bằng collection
    type: {
        type: Number,
        default: 1
    },
    
    //_________Thực hiện trên collection nào(VD: Pcm, Docs ...)
    collection: {
        kind: String,
        item: { type: Schema.Types.ObjectId, refPath: 'field.kind' }
    },

    //_________Tác động đến gì(VD: Comment, Phản hồi liên quan)
    subCollection: {
        kind: String,
        item: { type: Schema.Types.ObjectId, refPath: 'field.kind' }
    },

    //_________Nội dung thực thi hành động vd: Phan Văn Đệ-TRX đã xóa bình luận "Bạn bị làm sao í"
    content: String,

    //_________User thực thi hành động
    userCreate: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },
})   