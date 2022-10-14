const BASE_ROUTE = '/inspection';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const AREA                  = '/areas';
const GROUP                 = '/groups';
const AREA_GROUP            = '/area_group';
const DOCS                  = '/docs';
const DOC_COMMENT           = '/doc_comments'
const DOC_REACTION          = '/doc_reactions';
const DOC_CHECKLIST         = '/doc_checklists';

const CF_ROUTINGS_INSPECTION = {
    ORIGIN_APP: BASE_ROUTE,
    AREA                                       : `${BASE_ROUTE}${AREA}`,
    GROUP                                      : `${BASE_ROUTE}${GROUP}`,
    AREA_GROUP                                 : `${BASE_ROUTE}${AREA_GROUP}`,
    DOCS                                       : `${BASE_ROUTE}${DOCS}`, 
    DOC_GET_LIST_BY_PROPERTY                   : `${BASE_ROUTE}${DOCS}/get-list-by-property`,
    DOC_CHECKLIST                              : `${BASE_ROUTE}${DOC_CHECKLIST}`,
    DOC_COMMENT                                : `${BASE_ROUTE}${DOC_COMMENT}`,
    DOC_REACTION                               : `${BASE_ROUTE}${DOC_REACTION}`,
}

exports.CF_ROUTINGS_INSPECTION = CF_ROUTINGS_INSPECTION;