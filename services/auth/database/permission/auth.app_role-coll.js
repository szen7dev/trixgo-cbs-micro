"use strict";

const DATABASE_MIDDLEWARE   = require('../../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("app_role", {
    /**
     * Công ty
     */
    company: {
        type: Schema.Types.ObjectId,
        ref : 'company' 
    },
    /**
     * Ứng dụng
     */
    app: {
        type: Schema.Types.ObjectId,
        ref: "app"
    },
    /**
     * Tên nhóm
     */    
    name: String,
    /**
     * Mô tả nhóm
     */
    description: String,
    /**
     * Thành viên nhóm
     */
    members: [
        {
            type: Schema.Types.ObjectId,
            ref : "user"
        }
    ],
    userCreate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    },
    userUpdate: {
        type: Schema.Types.ObjectId,
        ref : "user"
    }
})   