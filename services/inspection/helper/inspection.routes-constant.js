const BASE_ROUTE = '/inspection';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const TEMPLATE_DOC = '/template_docs';

const CF_ROUTINGS_INSPECTION = {
    ORIGIN_APP: BASE_ROUTE,

    TEMPLATE_DOC_INSERT                               : `${BASE_ROUTE}${TEMPLATE_DOC}`, // /inspection/template_docs
}

exports.CF_ROUTINGS_INSPECTION = CF_ROUTINGS_INSPECTION;