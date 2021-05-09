const { CF_ACTIONS }                         = require('./common');
const { CF_ACTIONS_ACCOUNT }                 = require('./core/account'); 
const { CF_ACTIONS_AUTH }                 = require('./core/auth'); 
const { CF_ACTIONS_PRODUCTS }                 = require('./core/products'); 
const { CF_ACTIONS_POSTS }                 = require('./core/posts'); 
const { CF_ACTIONS_CATEGORIES }                 = require('./core/categories'); 
const { CF_ACTIONS_CRONJOB }                 = require('./core/cron-job'); 

module.exports = {
    CF_ACTIONS,
    CF_ACTIONS_POSTS,
    CF_ACTIONS_PRODUCTS,
    CF_ACTIONS_ACCOUNT,
    CF_ACTIONS_AUTH,
    CF_ACTIONS_CATEGORIES,
    CF_ACTIONS_CRONJOB
}
