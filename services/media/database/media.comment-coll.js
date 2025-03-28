"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_comment", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại
     * 1-Comment
     * 2-Đánh giá
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Bài viết
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },
    //_________Sản phẩm
    goods: {
        type    :  Schema.Types.ObjectId,
        ref     : 'goods'
    },
    //_________Nội dung
    content: String,
    //_________Đánh giá
    rating: Number,
    //_________ID Comment cha
    parent: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },
    //_________ID reply của comment reply cuối (Chi lưu cho comment cha)
    lastestReply: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media_comment'
    },
    //_________Các files được đính kèm trong bài viết
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],
    //_________Các ảnh được đính kèm trong bài viết
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],
    //_________Số lượng comment con của comment cha
    amountReply: {
        type    :  Number,
        default : 0
    },
    //_________Số lượng reaction con của comment cha
    amountReaction: {
        type    :  Number,
        default : 0
    },
    //_________Người tạo comment
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
    //_________Người cập nhật comment
    userUpdate: {
        type    : Schema.Types.ObjectId,
        ref     : "user"
    }
})