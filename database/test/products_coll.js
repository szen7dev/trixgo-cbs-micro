"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let productSchema = new Schema({
 
    name: String,

    price: Number,

    decription: String,

    amout: Number,

    image: String,

    status:{
        type: Number,
        default: 0
    },
    // người tạo
    author: {
        type: Schema.Types.ObjectId,
        ref: 'account'
    },
    category: {
        type: Schema.Types.ObjectId,
        ref: 'category'
    },  
}, {
	timestamps: true
});

let PRODUCT_COLL  = mongoose.model('products', productSchema);

module.exports = PRODUCT_COLL;