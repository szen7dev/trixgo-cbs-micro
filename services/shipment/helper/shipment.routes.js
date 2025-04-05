const BASE_API = "shipment"

const CF_ROUTINGS_SHIPMENT = {
    SHIPMENT_WEBHOOK                    : `/${BASE_API}/webhook`,

    SHIPMENT_POST_ORDER                 : `/${BASE_API}/order`,
    SHIPMENT_GET_FEE                    : `/${BASE_API}/fee`,
    SHIPMENT_GET_ORDER_STATUS           : `/${BASE_API}/order-status`,
}

exports.CF_ROUTINGS_SHIPMENT = CF_ROUTINGS_SHIPMENT;