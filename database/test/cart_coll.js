"use strict";


let mongoose = require('mongoose');
let Schema = mongoose.Schema;

let cartSchema = new Schema({
    userID:  {
        type: String,
        unique: true,
        trim: true,
        required: true
    },
    listProduct: [{
        type: Object,
        default: []
    }]
}, {
	timestamps: true
});

let CART_COLL  = mongoose.model('carts', cartSchema);

module.exports = CART_COLL;