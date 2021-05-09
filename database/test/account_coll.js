"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let userSchema = new Schema({
    email:  {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    fullName: String,
    firstName: String,
    password: {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    lastName: String,
    gender:{
        type: Number,
        // 1: Nam (Male)
        // 0: Nữ   (Female)
        default: 0
    },
    role:{
        type: Number,
        //  1: Admin
        //  2: Editor
        //  0: User 
        default: 0
    },
   
}, {
	timestamps: true
});

let ACCOUNT_COLL  = mongoose.model('account', userSchema);

module.exports = ACCOUNT_COLL;