const BASE_ROUTE = '/bidding';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const BIDDING_PLAN                  = '/bidding_plans';
const BIDDING_REQUEST               = '/bidding_requests';
const BIDDING_APPLY                 = '/bidding_applies';
const BIDDING_BILL                  = '/bidding_bills';
const BIDDING_QUOTATION             = '/bidding_quotations';

const CF_ROUTINGS_BIDDING = {
    ORIGIN_APP: BASE_ROUTE,

}

exports.CF_ROUTINGS_BIDDING = CF_ROUTINGS_BIDDING;