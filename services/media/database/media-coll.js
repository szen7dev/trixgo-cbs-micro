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
     * Nội dung của bài viết
     */
    content: {
        type: String,
		default: ''
    },

   /**
     * Loại bài viết
     * 1: Bài viết cá nhân (Only me)
     * 2: Bài viết cho bạn bè trong công ty (Friends in your company)
     * 3: Bài viết cho tất cả bạn bè (All your friends)
     * 4: Bài viết cho Group (Group)
     * 5: Bài viết cho Doanh nghiệp (Group)
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
     * Các files được đính kèm trong bài viết
     */
    files: [
        {
			type: Schema.Types.ObjectId,
			ref: 'media_file'
        }
    ],

    /**
     * Bạn bè được tag trong bài viết
     */
    tagFriends: [
        {
			type: Schema.Types.ObjectId,
			ref: 'user'
        }
    ],

    /**
     * Các ảnh được đính kèm trong bài viết
     */
    images: [
        {
			type: Schema.Types.ObjectId,
			ref: 'media_file'
        }
    ],

     /**
     * Background bài viết
     */
    background: {
        type: Schema.Types.ObjectId,
        ref: 'media_file'
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
     * ID nhóm
     */
    group: {
        type    : Schema.Types.ObjectId,
        // ref     : 'group'
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

})