"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref: 'company'
    },
    //_________Dự án, phòng ban
    department: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },
    /**
     * Phân loại
     * 1: Bài viết thông thường
     * 2: Bài viết câu chuyện khách hàng
     * 3: Truyện tranh, truyện hay
     * 4: 
     * 5: 
     * 6: 
	 */
    type: {
        type: Number,
        default: 1
    },
    //_________Tiêu đề của bài viết
    title: String,
    //_________Tóm tắt
    summary: String,
    //_________Nội dung của bài viết
    content: String,
    //_________Mô tả (SEO)
    description: String,
    //_________Slug/URL (SEO)
    slug: String,
    //_________Chuyên mục
    category: {
        type    : Schema.Types.ObjectId,
        ref     : 'media_menu'
    },
    //_________Tags
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'media_tag'
    }],
    //_________Thumbnail bài viết
    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'file'
    },
    //_________Video link
    video: { type: String, default: "https://www.youtube.com/watch?v=JTNCV5GTMl8" },
    /**
     * Trạng thái của bài viết
     * 1: Hoạt động (active)
     * 2: Ẩn
    */
    status: {
        type   : Number,
        default: 1
    },
    //_________Số lượng reaction
    amountReaction: {
        type    :  Number,
        default : 0
    },
    //_________Số lượng comment
    amountComment: {
        type    :  Number,
        default : 0
    },
    //_________Số lượng lượt xem
    amountView: {
        type    :  Number,
        default : 0
    },
    //_________Giờ bắn bài
    alert: { type: Number, default: 0 },
    //_________Người tạo bài viết
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    }
})