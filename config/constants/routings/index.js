const { CF_ROUTINGS }                         = require('./common');
const { CF_ROUTINGS_ACCOUNT }                 = require('./core/account'); 
const { CF_ROUTINGS_PRODUCTS }                 = require('./core/products'); 
const { CF_ROUTINGS_POSTS }                 = require('./core/posts'); 
const { CF_ROUTINGS_CATEGORIES }                 = require('./core/categories'); 

module.exports = {
    CF_ROUTINGS,
    CF_ROUTINGS_POSTS,
    CF_ROUTINGS_PRODUCTS,
    CF_ROUTINGS_ACCOUNT,
    CF_ROUTINGS_CATEGORIES,
}
