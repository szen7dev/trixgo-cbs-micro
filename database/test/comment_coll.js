"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
    post: {
        type: Schema.Types.ObjectId,
        ref : "post"
    },
    //_________Người tạo comment
    author: {
        type: Schema.Types.ObjectId,
        ref : "account"
    },
    content: String,
   /**
     * CẤU TRÚC ĐỆ QUY
     */
    parent: {
        type: Schema.Types.ObjectId,
        ref : "comment"
    },
    childs:[
        {
            type: Schema.Types.ObjectId,
            ref : "comment"
        }
    ],
    level: {
        type: Number,
        default: 1
    },
}, {
	timestamps: true
});

let COMMENT_COLL  = mongoose.model('comment', userSchema);

module.exports = COMMENT_COLL;