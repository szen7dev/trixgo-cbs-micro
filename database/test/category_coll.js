"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let categorySchema = new Schema({
 
    name: { 
        type: String,
        required: true,
        trim: true
    },
    // người tạo
    author: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    description: String,
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'product',
        default: []
    }]

}, {
	timestamps: true
});

let CATEGORY_COLL  = mongoose.model('category', categorySchema);

module.exports = CATEGORY_COLL;