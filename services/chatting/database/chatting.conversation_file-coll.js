"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("message_conversation_file", {
    conversation: {
        type    :  Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },

    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})