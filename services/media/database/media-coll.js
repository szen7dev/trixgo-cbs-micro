"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

const GeoSchema = new Schema({
    type: {
        type: String,
        default: "Point"
    },
    coordinates: {
        type: [Number],
        index: "2dsphere"
    }
});

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
    //_________Chủ đề chuyển đổi số
    other: {
        type    : Schema.Types.ObjectId,
        ref     : 'doctype'
    },
    /**
     * Loại bài viết
     * 1: Bài viết công ty (Thành viên trong công ty)
     * 2: Dự án, phòng ban
     * 3: Chuyển đổi số
     * 4: Hệ thống
     * 5: Bài viết cá nhân
     * 6: Bài viết giới thiệu công ty
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
    menu: {
        type    : Schema.Types.ObjectId,
        ref     : 'media_menu'
    },
    //_________Tags
    tags: [{
        type: Schema.Types.ObjectId,
        ref: 'doctype'
    }],
    //_________Địa điểm
	location: GeoSchema,
    //_________File
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'media_file'
    }],
    //_________Ảnh
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'media_file'
    }],
    //_________Background bài viết (ảnh đại diện bài viết)
    background: {
        type: Schema.Types.ObjectId,
        ref: 'media_file'
    },
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