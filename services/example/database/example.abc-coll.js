const DATABASE_MIDDLEWARE   = require('../../../tools/db/database.middleware');
const Schema                = require('mongoose').Schema;

module.exports  = DATABASE_MIDDLEWARE("categories", {
    name: { 
        type: String,
        required: true,
        trim: true
    },
    // người tạo
    // author: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'account'
    // },
    description: String,
    products: [{
        type: Schema.Types.ObjectId,
        ref: 'product',
        default: []
    }]
});