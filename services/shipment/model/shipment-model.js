const BaseModel                         = require('../../../tools/db/base_model');
const SHIPMENT_CORE_COLL                = require("../database/shipment.core-coll");

class Model extends BaseModel {
  createShipment({ ...params }) {
    return new Promise(async resolve => {
      try {
        const shipment = await SHIPMENT_CORE_COLL.create(params);
        return resolve({ error: false, data: shipment });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  updateShipment({ ...params }) {
    return new Promise(async resolve => {
      try {
        const shipment = await SHIPMENT_CORE_COLL.findByIdAndUpdate(params._id, params, { new: true });
        return resolve({ error: false, data: shipment });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }

  updateShipmentStatus({ shipmentId, status, statusDetails }) {
    return new Promise(async resolve => {
      try {
        const shipment = await SHIPMENT_CORE_COLL.findByIdAndUpdate(shipmentId, { status, statusDetails }, { new: true });
        return resolve({ error: false, data: shipment });
      } catch (error) {
        return resolve({ error: true, message: error.message });
      }
    });
  }
}

exports.MODEL = new Model;