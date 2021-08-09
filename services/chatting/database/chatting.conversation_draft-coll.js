"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * message draft: đang soạn nhưng chưa gửi
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
    message: String
})
