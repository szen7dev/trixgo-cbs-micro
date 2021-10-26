"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports = DATABASE_MIDDLEWARE("reaction_message", {
    /**
     * Cảm xúc
     */
	reaction: {
        type    : Schema.Types.ObjectId,
        ref     : 'reaction_core'
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
