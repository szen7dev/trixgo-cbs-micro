"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_reaction", {
    /**
     * Loại tương tác, like, tim, haha ... (xem trong cf_constants: REACTION_TYPES)
     */
    type: {
        type: Number,
        default: 1
    },
    author: {
        type: Schema.Types.ObjectId,
        ref : "user"                  
    },
    post: {
        type: Schema.Types.ObjectId,
        ref : "social_post" 
    },
    comment: {
        type: Schema.Types.ObjectId,
        ref : "comment" 
    },
    message: {
        type: Schema.Types.ObjectId,
        ref : "message_message" 
    },
	response: {
		type: Schema.Types.ObjectId,
		ref: "pcm_plan_response"
	},
    file: {
        type: Schema.Types.ObjectId,
		ref: "file"
    }
})