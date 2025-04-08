const uuidv4                            = require('uuid').v4;

const httpRequest                       = require('../../../tools/http');
const { convertObjectToQueryParams }    = require('../../../tools/utils/string_utils');

const BaseModel                         = require('../../../tools/db/base_model');
const SHIPMENT_CORE_MODEL               = require('./shipment-model').MODEL;

const GHTK_ORDER_COLL                   = require("../database/shipment.ghtk_order-coll");

const STORE_ORDER_COLL                  = require("../../store/database/store.order-coll");
const STORE_ORDER_PRODUCT_COLL          = require('../../store/database/store.order_product-coll');

const { SHIPMENT_STATUS, SHIPMENT_SERVICE_TYPE }         = require('../enum/shipment.enum');

const {
    GHTK_OPEN_API_URL,
    GHTK_API_KEY,
    GHTK_PARTNER_CODE,
} = process.env;

class Model extends BaseModel {
    pickupInfo = {
        name: "Công ty Cổ phần Elena",
        phone: "0966333227",
        address: "Số 17 Hải Âu 2",
        province: "Hà nội",
        district: "Gia lâm",
        ward: "Xã Đa Tốn",
    }

    constructor() {
        super(GHTK_ORDER_COLL);
    }

    createOrder({ orderId }) {
        return new Promise(async resolve => {
            try {
                const storeOrder = await STORE_ORDER_COLL
                    .findById(orderId)
                    .populate({
                        path: 'area1 area2 area3',
                        select: 'name'
                    })
                    .lean()

                if (!storeOrder) return resolve({ error: true, message: `Order ${orderId} not found` });

                const orderProducts = await STORE_ORDER_PRODUCT_COLL
                    .find({ order: orderId })
                    .select('name weight quantity _id')
                    .lean()

                if (!orderProducts.length) return resolve({ error: true, message: `Order ${orderId} has no products` });

                const { area1, area2, area3 } = storeOrder;
                const payload = {
                    products: orderProducts.map(item => ({
                        name: item.name,
                        weight: item.weight,
                        quantity: item.quantity,
                        product_code: item._id,
                    })),
                    order: {
                        id: orderId,
                        "pick_name": this.pickupInfo.name,
                        "pick_address": this.pickupInfo.address,
                        "pick_province": this.pickupInfo.province,
                        "pick_district": this.pickupInfo.district,
                        "pick_ward": this.pickupInfo.ward,
                        "pick_tel": this.pickupInfo.phone,
                        "tel": storeOrder.recipientPhone,
                        "email": storeOrder.buyerEmail,
                        "name": storeOrder.recipientName,
                        "address": storeOrder.recipientAddress,
                        "province": area1?.name || '',
                        "district": area2?.name || '',
                        "ward": area3?.name || '',
                        "hamlet": "Khác",
                        "is_freeship": "1",
                        "pick_money": storeOrder.shippingFee || 0,
                        "note": storeOrder.note?.length > 120 ? storeOrder.note.slice(0, 120) : storeOrder.note,
                        "value": storeOrder.amount,
                        // "transport": "fly",
                        "pick_option": "cod" // Đơn hàng xfast yêu cầu bắt buộc pick_option là COD
                    }
                };
                // console.log({ payload, p: payload.products })

                const response = await httpRequest.post(
                    `${GHTK_OPEN_API_URL}/services/shipment/order`, payload, {
                        headers: {
                            'Token': GHTK_API_KEY,
                            'X-Client-Source': GHTK_PARTNER_CODE,
                            'Content-type': 'application/json',
                        }
                    }
                );

                if(response.status !== 200) {
                    return resolve({
                        error: true,
                        message: "Can't request to GHTK API",
                        statusMessage: response.statusText,
                        status: response.status,
                    });
                }

                const { success, order, message, warning_message } = response.data;
                // console.log({ ...response.data })

                if (!success) {
                    return resolve({
                        error: true,
                        message,
                        warning_message,
                        statusMessage: response.statusText,
                        status: 400,
                    });
                }

                const {
                    partner_id,
                    label,
                    area,
                    fee,
                    insurance_fee,
                    estimated_pick_time,
                    estimated_deliver_time,
                    products,
                    status_id,
                    tracking_id,
                    sorting_code,
                    date_to_delay_pick,
                    pick_work_shift,
                    date_to_delay_deliver,
                    deliver_work_shift,
                    pkg_draft_id,
                    is_xfast,
                } = order;

                const shipment = await SHIPMENT_CORE_MODEL.createShipment({
                    orderId,
                    trackingNumber: tracking_id,
                    dates: {
                        estimated: {
                            pickup: estimated_pick_time,
                            delivery: estimated_deliver_time,
                        }
                    },
                    addresses: {
                        pickup: {
                            contactName: this.pickupInfo.name,
                            phone: this.pickupInfo.phone,
                            address: this.pickupInfo.address,
                            ward: this.pickupInfo.ward,
                            district: this.pickupInfo.district,
                            province: this.pickupInfo.province,
                        },
                        delivery: {
                            contactName: storeOrder.recipientName,
                            phone: storeOrder.recipientPhone,
                            address: storeOrder.recipientAddress,
                            ward: area3?.name || '',
                            district: area2?.name || '',
                            province: area1?.name || '',
                        }
                    },
                    costs: {
                        shipping: fee,
                        insurance: insurance_fee,
                        total: fee + insurance_fee,
                    },
                    serviceType: SHIPMENT_SERVICE_TYPE.GHTK,
                    status: SHIPMENT_STATUS.PENDING,
                })
                if (shipment.error) return resolve(shipment);

                const orderCreated = await GHTK_ORDER_COLL.create({
                    shipmentCoreId: shipment.data?._id,
                    partnerId: partner_id,
                    label,
                    area,
                    fee,
                    insuranceFee: insurance_fee,
                    estimatedPickTime: estimated_pick_time,
                    estimatedDeliverTime: estimated_deliver_time,
                    products,
                    statusId: status_id,
                    trackingId: tracking_id,
                    sortingCode: sorting_code,
                    dateToDelayPick: date_to_delay_pick,
                    pickWorkShift: pick_work_shift,
                    dateToDelayDeliver: date_to_delay_deliver,
                    deliverWorkShift: deliver_work_shift,
                    pkgDraftId: pkg_draft_id,
                    isXfast: is_xfast,
                })

                return resolve({ error: false, message: "OK", data: orderCreated })
            } catch(error) {
                console.error(error)
                return resolve({ error: true, message: error.message, status: 500 })
            }
        })
    }

    getOrderStatus({ trackingOrderId }) {
        return new Promise(async resolve => {
            try {
                const response = await httpRequest.get(
                    `${GHTK_OPEN_API_URL}/services/shipment/v2/${trackingOrderId}`, {
                        headers: {
                            'Token': GHTK_API_KEY,
                            'X-Client-Source': GHTK_PARTNER_CODE,
                            'Content-type': 'application/json',
                        }
                    }
                );

                if(response.status !== 200) {
                    return resolve({
                        error: true,
                        message: "Can't request to GHTK API",
                        statusMessage: response.statusText,
                    });
                }

                const { success, order, message } = response.data;

                if (!success) {
                    return resolve({
                        error: true,
                        message,
                        statusMessage: response.statusText,
                    });
                }

                resolve({ error: false, data: order });
            } catch(error) {
                resolve({ error: true, message: error.message });
            }
        })
    }

    getFee({ address, weight, province, district, pickProvince, pickDistrict, value, deliverOption }) {
        return new Promise(async resolve => {
            try {
                const params = {
                    address, weight, province, district, value,
                    pick_province: pickProvince,
                    pick_district: pickDistrict,
                    deliver_option: deliverOption,
                }

                const response = await httpRequest.get(
                    `${GHTK_OPEN_API_URL}/services/shipment/fee?${convertObjectToQueryParams(params)}`, {
                        headers: {
                            'Token': GHTK_API_KEY,
                            'Content-type': 'application/json',
                        }
                    }
                );

                if(response.status !== 200) {
                    return resolve({
                        error: true,
                        message: "Can't request to GHTK API",
                        statusMessage: response.statusText,
                    });
                }

                const { success, fee, message } = response.data;

                if (!success) {
                    return resolve({
                        error: true,
                        message,
                        statusMessage: response.statusText,
                    });
                }

                const {
                    fee: shippingFee, insurance_fee: insuranceFee, include_vat: includeVat,
                    extFees, ship_fee_only: shipFeeOnly, distance
                } = fee;

                return resolve({
                    error: false,
                    status: 200,
                    data: {
                        fee: shippingFee, insurance_fee: insuranceFee, include_vat: includeVat,
                        extFees, ship_fee_only: shipFeeOnly, distance
                    }
                })
            } catch(error) {
                return resolve({ error: true, message: error.message })
            }
        })
    }

    handleWebhook({ ...params }) {
        return new Promise(async resolve => {
            try {
                resolve({ error: false, message: 'OK', status: 200 });
            } catch(error) {
                resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;