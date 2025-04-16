"use strict";

const Schema = require("mongoose").Schema;

const DATABASE_MIDDLEWARE = require("../../../tools/db/database.middleware");
const { SHIPMENT_STATUS } = require("../enum/shipment.enum");

/**
 * Shipment Core Collection Schema
 * Handles core shipping functionality and relationships between orders, carriers, and shipments
 */
module.exports = DATABASE_MIDDLEWARE("shipment_core", {
  // Reference to the store order
  orderId: {
    type: Schema.Types.ObjectId,
    ref: "store_order",
    required: true,
    index: true,
  },

  // Shipping provider specific tracking number
  trackingNumber: {
    type: String,
    index: true,
  },

  // Shipping service type (e.g., GHTK)
  serviceType: {
    type: String,
    required: true,
  },

  // Current status of the shipment
  status: {
    type: String,
    enum: Object.keys(SHIPMENT_STATUS),
    default: "PENDING",
    index: true,
  },

  // Detailed status message
  statusMessage: String,
  statusDetails: Schema.Types.Mixed,

  // Status history for tracking changes
  statusHistory: [
    {
      status: {
        type: String,
        enum: Object.keys(SHIPMENT_STATUS),
      },
      message: String,
      timestamp: {
        type: Date,
        default: Date.now,
      },
      location: String,
    },
  ],

  // Shipping dates
  dates: {
    created: {
      type: Date,
      default: Date.now,
      required: true,
    },
    estimated: {
      pickup: Date,
      delivery: Date,
    },
    actual: {
      pickup: Date,
      delivery: Date,
    },
  },

  // Shipping addresses
  addresses: {
    pickup: {
      contactName: String,
      phone: String,
      address: String,
      ward: String,
      district: String,
      province: String,
      country: {
        type: String,
        default: "VN",
      },
    },
    delivery: {
      contactName: String,
      phone: String,
      address: String,
      ward: String,
      district: String,
      province: String,
      country: {
        type: String,
        default: "VN",
      },
    },
  },

  // Shipping costs
  costs: {
    shipping: {
      type: Number,
      default: 0,
    },
    insurance: {
      type: Number,
      default: 0,
    },
    cod: {
      type: Number,
      default: 0,
    },
    other: {
      type: Number,
      default: 0,
    },
    total: {
      type: Number,
      default: 0,
    },
  },

  // Timestamps for record keeping
  metadata: {
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "user",
    },
  },
});
