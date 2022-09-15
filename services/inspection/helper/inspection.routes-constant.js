const BASE_ROUTE = '/inspection';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const AREA                  = '/areas';
const DOCS                  = '/docs';
const DOC_COMMENT           = '/doc_comments'
const DOC_REACTION          = '/doc_reactions';
const DOC_CHECKLIST         = '/doc_checklists';

const CF_ROUTINGS_INSPECTION = {
    ORIGIN_APP: BASE_ROUTE,
    DOC_COMMENT                                : `${BASE_ROUTE}${DOC_COMMENT}`,           // /inspection/doc_comment
    DOC_REACTION                               : `${BASE_ROUTE}${DOC_REACTION}`,          // /inspection/template_doc_reactions
    AREA                                       : `${BASE_ROUTE}${AREA}`,                  // /inspection/template_areas
    DOCS                                       : `${BASE_ROUTE}${DOCS}`,                  // /inspection/template_docs
    DOC_CHECKLIST                              : `${BASE_ROUTE}${DOC_CHECKLIST}`,         // /inspection/doc_checklists
}

exports.CF_ROUTINGS_INSPECTION = CF_ROUTINGS_INSPECTION;