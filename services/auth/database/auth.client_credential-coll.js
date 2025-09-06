"use strict";

const DATABASE_MIDDLEWARE = require("../../../tools/db/database.middleware");
const Schema = require("mongoose").Schema;

module.exports = DATABASE_MIDDLEWARE("client_credential", {
  clientId: { type: String, required: true, unique: true },
  clientSecretHash: { type: String, required: true },
  name: { type: String },
  scopes: { type: [String], default: [] },
  revoked: { type: Boolean, default: false },
  /**
   * Người tạo
   */
  userCreate: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
  /**
   * Người sử dụng client credential
   */
  userId: {
    type: Schema.Types.ObjectId,
    ref: "user",
  },
});
