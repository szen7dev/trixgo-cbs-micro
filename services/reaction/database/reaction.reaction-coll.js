"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("reaction_core", {
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
})