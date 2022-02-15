"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_seen", {
    /**
     * Bài viết 
     */
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    /**
     *  Người tạo
     */
    userCreate: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})