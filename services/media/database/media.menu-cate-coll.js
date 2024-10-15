"use strict";

const DATABASE_MIDDLEWARE   = require('../../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_menu_cate", {
    menu_item: {
        type: Schema.Types.ObjectId,
        ref : "media_menu"
    },
    menu_group: {
        type: Schema.Types.ObjectId,
        ref : "media_menu"
    },
    menu: {
        type: Schema.Types.ObjectId,
        ref : "media_menu"
    },
    product: {
        type: Schema.Types.ObjectId,
        ref: "goods"
    },
    post: {
        type: Schema.Types.ObjectId,
        ref: "media"
    },
    userCreate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref: "user"
    }
})   