"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("media_file", {
    media: {
        type    :  Schema.Types.ObjectId,
        ref     : 'media'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file_core'
    },
})