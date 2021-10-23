"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_user_seen", {

    /**
     * Bài viết 
     */
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },

    /**
     *  Người xem bài viết
     */
    userSeen: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})