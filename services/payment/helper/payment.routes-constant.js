const BASE_ROUTE = '/payment';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const TRANSACTION = '/transactions';

const CF_ROUTINGS_PAYMENT = {
    ORIGIN_APP: BASE_ROUTE,

    GET_LIST_TRANSACTION                                : `${BASE_ROUTE}${TRANSACTION}`,
    GET_LIST_TRANSACTION_BY_USER_WITH_STATUS            : `${BASE_ROUTE}${TRANSACTION}/users/:userID`,
    UPDATE_STATUS                                       : `${BASE_ROUTE}${TRANSACTION}/:transactionID`,

    GET_LIST_BANKS                                      : `${BASE_ROUTE}/banks`,
    INQUIRY_BANK_ACCOUNT                                : `${BASE_ROUTE}/inquiry-bank-account`,
    DISBURSEMENT_REQUEST                                : `${BASE_ROUTE}/disbursement/request`,
    DISBURSEMENT_CONFIRM                                : `${BASE_ROUTE}/disbursement/confirm`,
    CREATE_URL_PAYMENT                                  : `${BASE_ROUTE}/url`,
    URL_RETURN_PAYMENT                                  : `${BASE_ROUTE}/url-return`,
    URL_IPN_PAYMENT                                     : `${BASE_ROUTE}/ipn-return`,
    URL_NLC_PAYBEHALF                                   : `${BASE_ROUTE}/nlc-return`,
}

exports.CF_ROUTINGS_PAYMENT = CF_ROUTINGS_PAYMENT;
