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
     * Avatar Nhóm chat
     */
    avatar: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_conversation_file'
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
     * Cấu hình admin cuộc hội thoại
    */
	config: {
		// Làm nổi bật tin của Admin
		configHighlight: {
			type: Number,
			default: 0
		},
		// Member mới được xem tin nhắn cũ
		configSeeOldMessage: {
			type: Number,
			default: 1
		},
		// Members được sửa thông tin nhóm
		configEditInfo: {
			type: Number,
			default: 1
		},
		// Members được tạo ghi chú, nhắc hẹn
		configCreateNote: {
			type: Number,
			default: 1
		},
		// Members được tạo bình chọn
		configCreatePoll: {
			type: Number,
			default: 1
		},
		// Members được ghim tin nhắn
		configPinMessage: {
			type: Number,
			default: 1
		},
		// Members được gửi tin nhắn
		configSendMessage: {
			type: Number,
			default: 1
		},
	}

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
