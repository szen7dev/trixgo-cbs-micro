"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;
/**
 * tách conversation_link: không dùng links trong conversation
 */
module.exports  = DATABASE_MIDDLEWARE("message_conversation_draft", {
    conversation: {
        type    :  Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },
    user: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
    // message draft: đang soạn nhưng chưa gửi
    message : {
        type : String
    }
})