"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports = DATABASE_MIDDLEWARE("message_message_reaction", {
    /**
     * Cảm xúc
     */
	reaction: {
        type    : Schema.Types.ObjectId,
        ref     : 'reaction'
    },
	/**
     * Tin nhắn
     */
 	message: {
		type    : Schema.Types.ObjectId,
		ref     : 'message_message'
	},
    /**
     *  Người reaction
     */
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})
