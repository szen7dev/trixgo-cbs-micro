"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 * tách conversation_link: không dùng links trong conversation
 */
module.exports  = DATABASE_MIDDLEWARE("message_conversation_link", {
    conversation: {
        type    :  Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },
    link: {
        type: String
    },
	author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})