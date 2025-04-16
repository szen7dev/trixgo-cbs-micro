
"use strict";

const Schema = require("mongoose").Schema;

const DATABASE_MIDDLEWARE = require('../../../tools/db/database.middleware');

module.exports = DATABASE_MIDDLEWARE("shipment_ghtk_order", {
    shipmentCoreId: {
      type: Schema.Types.ObjectId,
      ref: "shipment_core",
    },
    partnerId: {
        type: String,
        required: true
    },
    label: String,
    area: String,
    fee: {
        type: Number,
        default: 0
    },
    insuranceFee: {
        type: Number,
        default: 0
    },
    estimatedPickTime: Date,
    estimatedDeliverTime: Date,
    products: [{
        name: String,
        weight: Number,
        quantity: Number,
        productCode: String
    }],
    statusId: String,
    trackingId: String,
    sortingCode: String,
    dateToDelayPick: Date,
    pickWorkShift: String,
    dateToDelayDeliver: Date,
    deliverWorkShift: String,
    pkgDraftId: String,
    isXfast: Boolean,
    status: String,
    lastWebhookUpdate: Date,
    reasonCode: String,
    reason: String,
    actionTime: Date,
    weight: Number,
});