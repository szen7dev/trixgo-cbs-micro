/**
 * Build-in
 */
const CacheCleaner                  = require("../../tools/mixins/cache.cleaner.mixin");
const DbService                     = require("../../tools/mixins/db.mixin");

/**
 * Constants
 */
const { CF_DOMAIN_SERVICES }        = require("../gateway/helper/domain.constant");
const { CF_ACTIONS_SHIPMENT }       = require('./helper/shipment.actions');

/**
 * Handlers
 */
const SHIPMENT_GHTK_HANDLER         = require("./handler/shipment.ghtk-handler");

/**
 * Collections
 */
const SHIPMENT_CORE_COLL            = require("./database/shipment.core-coll");
const GHTK_ORDER_COLL               = require("./database/shipment.ghtk_order-coll");

const STORE__ORDER_COLL  			= require("../store/database/store.order-coll");
const STORE__ORDER_PRODUCT_COLL  	= require('../store/database/store.order_product-coll');

module.exports = {
    name: CF_DOMAIN_SERVICES.SHIPMENT,
    mixins: [
        DbService(SHIPMENT_CORE_COLL),
        DbService(GHTK_ORDER_COLL),
        DbService(STORE__ORDER_COLL),
        DbService(STORE__ORDER_PRODUCT_COLL),
        CacheCleaner([CF_DOMAIN_SERVICES.SHIPMENT])
    ],
    actions: {
        [CF_ACTIONS_SHIPMENT.SHIPMENT_GHTK_GET_FEE]             : SHIPMENT_GHTK_HANDLER.getFee,
        [CF_ACTIONS_SHIPMENT.SHIPMENT_GHTK_CREATE_ORDER]        : SHIPMENT_GHTK_HANDLER.createOrder,
        [CF_ACTIONS_SHIPMENT.SHIPMENT_GHTK_GET_ORDER_STATUS]    : SHIPMENT_GHTK_HANDLER.getOrderStatus,
        [CF_ACTIONS_SHIPMENT.SHIPMENT_GHTK_WEBHOOK]             : SHIPMENT_GHTK_HANDLER.webhook,
    },
}