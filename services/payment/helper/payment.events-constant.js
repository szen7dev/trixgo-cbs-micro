/**
 * danh sách các event của PAYMENT_SERVICE
 *  - áp dụng cho các service khac
 */

module.exports = {
    /**
     * @target:
     *  - user_service: nhận event và cập nhật thông tin  (thông tin gói sử dụng)
     *  - mail_service: nhận event và gửi mail
     */
    "payment.transaction_success": {
        handler(ctx) {
            /**
             * 1/ lấy dữ liệu đầu vào
             * 2/ thực hiện công việc
             *      + update process (db, redis) 
             */
            console.log("Payload:", ctx.params);
            console.log("Sender:", ctx.nodeID);
            console.log("Metadata:", ctx.meta);
            console.log("The called event name:", ctx.eventName);
            // ctx.emit("accounts.created", { user: ctx.params.user });
        }
    }
}