const BASE_ROUTE = '/payment';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const TRANSACTION = '/transactions';

const CF_ROUTINGS_PAYMENT = {
    ORIGIN_APP: BASE_ROUTE,

    INSERT_TRANSACTION                                  : `${BASE_ROUTE}${TRANSACTION}`, // /payment/transactions
    GET_LIST_TRANSACTION_BY_USER_WITH_STATUS            : `${BASE_ROUTE}${TRANSACTION}/users/:{userID}`, // /payment/transactions/users/{userID} 
    UPDATE_STATUS                                       : `${BASE_ROUTE}${TRANSACTION}/:{transactionID}`, // /payment/transactions/{transactionID}
}

exports.CF_ROUTINGS_PAYMENT = CF_ROUTINGS_PAYMENT;