"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_menu", {
    //_________Công ty
    company: {
        type: Schema.Types.ObjectId,
        ref : "company"
    },
    //_________Phần tử cha
    parent: {
        type: Schema.Types.ObjectId,
        ref: "media_menu"
    },
    childs: [{
        type: Schema.Types.ObjectId,
        ref: "media_menu"
    }],
    //_________Level
    level: {
        type: Number,
        default: 1
    },
    /**
     * Phân loại
     * 1-Bài viết/Blogs - Trang tổng thể tất cả bài viết (/chu-de/ten-menu-chu-de)
     * 2-Danh sách các bài viết của một chuyên mục cụ thể (/chu-de/ten-menu-chu-de/ten-chuyen-muc)
     * Chi tiết bài viết: /bai-viet/ten-bai-viet.html
     * 3-Sản phẩm - Trang tổng thể tất cả sản phẩm (/danh-muc/ten-menu-san-pham)
     * 4-Danh sách các sản phẩm của một chuyên mục cụ thể (/danh-muc/ten-menu-san-pham/ten-chuyen-muc)
     * Chi tiết sản phẩm: /san-pham/ten-san-pham.html
     * 5-Các trang đặc thù khác đi theo UI cụ thể
     */
    type: {
        type: Number,
        default: 1
    },
    //_________Tên
    name: String,
    //_________Slug/URL
    slug: String,
    //_________Thời hạn
    expired: Date,
    //________Ghi chú
    note: String,
    //_________Thứ tự hiển thị
    order: {
        type: Number,
        default: 1
    },
    //________Trạng thái (1-Active|2-Hủy)
    status: {
        type: Number,
        default: 1
    },
    //_________Thumbnail
    thumbnail: {
        type: Schema.Types.ObjectId,
        ref: 'file'
    },
    //_________Hình ảnh
    images: [{
        type: Schema.Types.ObjectId,
        ref: "file"
    }],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
})