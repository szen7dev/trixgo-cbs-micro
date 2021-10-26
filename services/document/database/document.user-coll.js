"use strict";

const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

/**
 *  User được truy cập Hồ sơ văn bản
 */
module.exports  = DATABASE_MIDDLEWARE("document_user", {
    document: {
        type: Schema.Types.ObjectId,
        ref: "document_doc"
    },
    user: {
        type: Schema.Types.ObjectId,
        ref: "user"
    },
    /**
     * Quyền hạn
     * 0: Người khởi tạo
     * 1: Người được xem
     * 2: Người được chỉnh sửa
     */
    permission: {
        type: Number,
        default: 0
    }
});
