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
    /**
     *  Người tạo bài viết
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },

    /**
     * Tiêu đề của bài viết
     */
    title: {
        type: String,
		default: ''
    },

    /**
     * Nội dung của bài viết
     */
    content: {
        type: String,
		default: ''
    },

    /**
     * Loại bài viết
     * 1: Bài viết công ty (Thành viên trong công ty)
     * 2: Dự án, phòng ban
     * 3: Chuyển đổi số
     * 4: Hệ thống
     * 5: Bài viết cá nhân
     * ..... Sau bổ sung thêm vài loại bài viết
	 */
    type: {
        type: Number,
        default: 1
    },

	/**
     * Bài viết gán địa điểm
     */
	location: GeoSchema,

    /**
     * User đã xem bài viết
     */
    usersSeen: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],

    /**
     * Bạn bè được tag trong bài viết
     */
    tagFriends: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],

    /**
     * Các files được đính kèm trong bài viết
     */
    files: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],

    /**
     * Các ảnh được đính kèm trong bài viết
     */
    images: [{
        type: Schema.Types.ObjectId,
        ref: 'file'
    }],

    /**
     * Background bài viết
     */
    background: {
        type: Schema.Types.ObjectId,
        ref: 'file'
    },

    /**
     * Trạng thái của bài viết
     * 1: hoạt động (active)
     * 2: đã xóa
    */
    status: {
        type   : Number,
        default: 1
    },

    /**
     * ID Công ty
     */
    company: {
        type    : Schema.Types.ObjectId,
        ref     : 'company'
    },

    /**
     * ID dự án phòng ban
     */
    department: {
        type    : Schema.Types.ObjectId,
        ref     : 'department'
    },

    /**
     * ID Chủ đề chuyển đổi số
     */
    other: {
        type    : Schema.Types.ObjectId,
        ref     : 'doctype'
    },

    /**
     * 1: Mặc định
     * 2: Lưu bài viết
     * 3: Ghim bài viết
     */
    kind: {
        type: Number,
        default: 1
    },

    //_________Số lượng reaction của media
    amountReaction: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng comment của media
    amountComment: {
        type    :  Number,
        default : 0
    },

    //_________Số lượng lượt xem của media
    amountView: {
        type    :  Number,
        default : 0
    },

    //_________1 mảng loại cảm xúc để show trên view(3 cái)
    typeReactions: [{
        type :  Number,
    }],
})