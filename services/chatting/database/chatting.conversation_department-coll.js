"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("message_conversation_department", {
    // message_conversation
    conversation: {
        type    :  Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },

    department: {
        type: Schema.Types.ObjectId,
        ref: "department"
    },

    author : {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})