"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports = DATABASE_MIDDLEWARE("message_conversation", {
    /**
     * Tên của cuộc hội thoại (Tên chat nhóm)
     */
    name: {
        type: String
    },
    /**
     * Mô tả của cuộc hội thoại (Mô tả chat nhóm)
     */
    description: {
        type: String
    },
    /**
     * Số lượng người tham gia cuộc hội thoại
     */
    members: [{
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }],
    /**
     * Chủ của cuộc hội thoại (người gửi, nếu là chat nhóm thì là chủ nhóm)
     * - Author đầu tiên trong mảng chính là root Author (người tạo ra nhóm chát)
     */
    authors: [{
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    }],
    /**
     * Tin nhắn cuối cùng trong cuộc hội thoại
     */
    lastMessage: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_message'
    },
    /**
     * Logo Nhóm chat
     */
    logo: {
        type    : Schema.Types.ObjectId,
        ref     : 'file'
    },
    /**
     * Tin nhắn được ghim
     */
    pin: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_message'
    },
    /**
     * Danh sách user bỏ lở tin nhắn
     */
    arrMissMessage : [{
        userID: {
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        amount: {
            type: Number,
            default: 0
        },
        timeOffline: {
            type: Date
        }
    }],
    /**
     * Danh sách user ẩn thông báo cuộc hội thoại
     */
    usersMute: [{
        user: { 
            type: Schema.Types.ObjectId,
            ref: 'user'
        },
        time: {
            type: Date
        }
    }],
    /**
     * Danh sách user ping cuộc hội thoại
    */
    usersPin: [{
        type: Schema.Types.ObjectId,
        ref: 'user'
    }],

    /**
	 * Các files được đính kèm trong cuộc hội thoại
	 * chatting.conversation_link-coll.js
     */
   	// links: [{
    //    type : String
    // }],

    // chatting.conversation_draft-coll.js
    // lưu lại tin nhắn đang soạn dỡ
    // arrMesageTypingUsers : [{
    //     userID :  {
    //         type    : Schema.Types.ObjectId,
    //         ref     : 'user'
    //     },
        
    //     messageTyping : {
    //         type : String
    //     }
    // }]
});