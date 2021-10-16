const BASE_ROUTE = '/inspection';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const TEMPLATE_DOC          = '/template_docs';
const TEMPLATE_CHECKLIST    = '/template_checklists';
const TEMPLATE_DOC_REACTION = '/template_doc_reactions';
const AREA                  = '/areas';
const DOCS                  = '/docs';
const TEMPLATE_DOC_COMMENT  = '/template_doc_comments'
const DOC_COMMENT           = '/doc_comments'
const DOC_REACTION          = '/doc_reactions';

const CF_ROUTINGS_INSPECTION = {
    ORIGIN_APP: BASE_ROUTE,

    TEMPLATE_DOC                               : `${BASE_ROUTE}${TEMPLATE_DOC}`,          // /inspection/template_docs
    TEMPLATE_CHECKLIST                         : `${BASE_ROUTE}${TEMPLATE_CHECKLIST}`,    // /inspection/template_checklists
    TEMPLATE_DOC_REACTION                      : `${BASE_ROUTE}${TEMPLATE_DOC_REACTION}`, // /inspection/template_doc_reactions
    TEMPLATE_DOC_COMMENT                       : `${BASE_ROUTE}${TEMPLATE_DOC_COMMENT}`, // /inspection/template_doc_reactions
    DOC_COMMENT                                : `${BASE_ROUTE}${DOC_COMMENT}`,           // /inspection/doc_comment
    DOC_REACTION                               : `${BASE_ROUTE}${DOC_REACTION}`, // /inspection/template_doc_reactions
    AREA                                       : `${BASE_ROUTE}${AREA}`,                  // /inspection/template_areas
    DOCS                                       : `${BASE_ROUTE}${DOCS}`,                  // /inspection/template_docs
}

exports.CF_ROUTINGS_INSPECTION = CF_ROUTINGS_INSPECTION;