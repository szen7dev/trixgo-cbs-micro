const BASE_ROUTE = '/bidding';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const BIDDING_DOC                   = '/bidding_docs';
const BIDDING_DOCUMENT_REQUEST      = '/bidding_document_requests';
const BIDDING_DOCUMENT_APPLY        = '/bidding_document_applies';
const BIDDING_BILL                  = '/bidding_bills';
const BIDDING_QUOTATION             = '/bidding_quotations';

const CF_ROUTINGS_BIDDING = {
    ORIGIN_APP: BASE_ROUTE,

    BIDDING_DOC                     : `${BASE_ROUTE}${BIDDING_DOC}`, 
    BIDDING_DOCUMENT_REQUEST        : `${BASE_ROUTE}${BIDDING_DOCUMENT_REQUEST}`, 
    BIDDING_DOCUMENT_APPLY          : `${BASE_ROUTE}${BIDDING_DOCUMENT_APPLY}`, 
    BIDDING_BILL                    : `${BASE_ROUTE}${BIDDING_BILL}`, 
    BIDDING_QUOTATION               : `${BASE_ROUTE}${BIDDING_QUOTATION}`, 
}

exports.CF_ROUTINGS_BIDDING = CF_ROUTINGS_BIDDING;