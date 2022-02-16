"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports = DATABASE_MIDDLEWARE("message_conversation_member", {

    /**
     * Cuộc hội thoại
     */
    conversation: {
        type    : Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },

    /**
     * Thành viên cuộc hội thoại
     */
    member: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },

    /**
     * Được thêm bởi user
     */
    addedBy: {
        type    : Schema.Types.ObjectId,
        ref     : 'user'
    },

    /**
     * Thời gian cuối cùng seen
     */
    timeLastSeen: {
        type: Date
    }
});
