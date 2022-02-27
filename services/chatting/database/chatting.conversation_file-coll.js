"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("message_conversation_file", {
    /**
     * Tên file (tương ứng tên file trong file_core)
     */
    fileName: String,
    /**
     * Loại file
     * 1. Hình ảnh
     * 2. File
     * 3. Audio
     * 4. Video
     */
    fileType: Number,
    conversation: {
        type    :  Schema.Types.ObjectId,
        ref     : 'message_conversation'
    },
    file: {
        type    :  Schema.Types.ObjectId,
        ref     : 'file'
    },
    author: {
        type    :  Schema.Types.ObjectId,
        ref     : 'user'
    },
})