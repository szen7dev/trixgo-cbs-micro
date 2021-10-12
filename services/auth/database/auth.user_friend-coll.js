"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("user_friend", {
    //_______ Tôi
    user: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
    //_______ Bạn
    friend: {
        type: Schema.Types.ObjectId,
        ref : 'user'
    },
})
