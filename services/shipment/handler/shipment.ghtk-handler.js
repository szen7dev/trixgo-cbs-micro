const { renderStatusCodeAndResponse }   = require('../../../tools/utils/status_code');
const SHIPMENT_MODEL                    = require('../model/shipment.ghtk-model').MODEL;

module.exports = {
    createOrder: {
        params: {
            orderId: { type: "string" },
        },
        async handler(ctx) {
            try {
                const { orderId } = ctx.params

                const resultAfterCallHandler = await SHIPMENT_MODEL.createOrder({
                    orderId,
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    getOrderStatus: {
        params: {
            trackingOrderId: { type: "string" }, // Mã đơn hàng GHTK hoặc mã Đối tác được truyền qua ở trường order.id ở API đăng đơn
        },
        async handler(ctx) {
            try {
                const { trackingOrderId } = ctx.params

                const resultAfterCallHandler = await SHIPMENT_MODEL.getOrderStatus({
                    trackingOrderId,
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            }
            catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    getFee: {
        params: {
            address: { type: "string", optional: true }, // Địa chỉ chi tiết của người nhận hàng, ví dụ: Chung cư CT1, ngõ 58, đường Trần Bình
            weight: { type: "string" }, // Cân nặng của gói hàng, đơn vị sử dụng Gram
            province: { type: "string" }, // Tên tỉnh/thành phố của người nhận hàng hóa
            district: { type: "string" }, // Tên quận/huyện của người nhận hàng hóa
            pickProvince: { type: "string" }, // Tên tỉnh/thành phố nơi lấy hàng hóa
            pickDistrict: { type: "string" }, // Tên quận/huyện nơi lấy hàng hóa
            value: { type: "string", optional: true }, // Giá trị thực của đơn hàng áp dụng để tính phí bảo hiểm, đơn vị sử dụng VNĐ
            deliverOption: { type: "string", default: 'xteam' }, // Sử dụng phương thức vận chuyển xfast. Nhận 1 trong 2 giá trị xteam/none
        },
        async handler(ctx) {
            try {
                const { address, weight, province, district, pickProvince, pickDistrict, value, deliverOption } = ctx.params

                const resultAfterCallHandler = await SHIPMENT_MODEL.getFee({
                    address, weight, province, district, pickProvince, pickDistrict, value, deliverOption
                })

                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

    webhook: {
        async handler(ctx) {
            try {
                const params = ctx.params
                console.log({ GHTK_WEBHOOK_PARAMS: params })

                const resultAfterCallHandler = await SHIPMENT_MODEL.handleWebhook(params);
                return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
            } catch (error) {
                return renderStatusCodeAndResponse({ ctx, error_message: error.message });
            }
        }
    },

}