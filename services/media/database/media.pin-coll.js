"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_pin", {
    /**
     * Bài viết 
     */
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },
    /**
     *  Người ghim bài viết
     */
    userPin: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})