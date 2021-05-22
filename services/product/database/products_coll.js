const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("products", {
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
});