const mongoose  = require('mongoose');

const conn      = mongoose.createConnection(`mongodb://localhost:27017/woadate_test`);

let USER_MODEL_2ND      = conn.model('Users', require('../../database/core/user-coll.2nd'))
let CATEGORY_MODEL_2ND  = conn.model('Categories', require('../../database/core/category-coll.2nd'))


exports.USER_MODEL_2ND      = USER_MODEL_2ND;
exports.CATEGORY_MODEL_2ND  = CATEGORY_MODEL_2ND;