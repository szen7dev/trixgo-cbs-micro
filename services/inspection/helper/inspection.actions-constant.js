// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_INSPECTION';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const TEMPLATE_DOC          = 'TEMPLATE_DOC';
const TEMPLATE_CHECKLIST    = 'TEMPLATE_CHECKLIST';
const TEMPLATE_DOC_REACTION = 'TEMPLATE_DOC_REACTION';
const TEMPLATE_DOC_COMMENT  = 'TEMPLATE_DOC_COMMENT';
const AREA                  = 'AREA';
const DOC                   = 'DOCS';
// const CASE_2      = 'CASE_2';

const CF_ACTIONS_INSPECTION = {
    TEMPLATE_DOC_GET_LIST                           : `${BASE_ACTIONS}_${TEMPLATE_DOC}_GET_LIST`,
    TEMPLATE_DOC_INSERT                             : `${BASE_ACTIONS}_${TEMPLATE_DOC}_INSERT`,
    TEMPLATE_DOC_UPDATE                             : `${BASE_ACTIONS}_${TEMPLATE_DOC}_UPDATE`,
    TEMPLATE_DOC_REMOVE                             : `${BASE_ACTIONS}_${TEMPLATE_DOC}_REMOVE`,

    TEMPLATE_CHECKLIST_INSERT                       : `${BASE_ACTIONS}_${TEMPLATE_CHECKLIST}_INSERT`,
    TEMPLATE_CHECKLIST_UPDATE                       : `${BASE_ACTIONS}_${TEMPLATE_CHECKLIST}_UPDATE`,
    TEMPLATE_CHECKLIST_REMOVE                       : `${BASE_ACTIONS}_${TEMPLATE_CHECKLIST}_REMOVE`,
    TEMPLATE_CHECKLIST_LIST                         : `${BASE_ACTIONS}_${TEMPLATE_CHECKLIST}_LIST`,

    TEMPLATE_DOC_REACTION_INSERT                    : `${BASE_ACTIONS}_${TEMPLATE_DOC_REACTION}_INSERT`,
    TEMPLATE_DOC_REACTION_REMOVE                    : `${BASE_ACTIONS}_${TEMPLATE_DOC_REACTION}_REMOVE`,
    TEMPLATE_DOC_REACTION_LIST                      : `${BASE_ACTIONS}_${TEMPLATE_DOC_REACTION}_LIST`,

    TEMPLATE_DOC_COMMENT_INSERT                     : `${BASE_ACTIONS}_${TEMPLATE_DOC_COMMENT}_INSERT`,
    TEMPLATE_DOC_COMMENT_UPDATE                     : `${BASE_ACTIONS}_${TEMPLATE_DOC_COMMENT}_UPDATE`,
    TEMPLATE_DOC_COMMENT_REMOVE                     : `${BASE_ACTIONS}_${TEMPLATE_DOC_COMMENT}_REMOVE`,
    TEMPLATE_DOC_COMMENT_LIST                       : `${BASE_ACTIONS}_${TEMPLATE_DOC_COMMENT}_LIST`,

    AREA_INSERT                                     : `${BASE_ACTIONS}_${AREA}_INSERT`,
    AREA_UPDATE                                     : `${BASE_ACTIONS}_${AREA}_UPDATE`,
    AREA_REMOVE                                     : `${BASE_ACTIONS}_${AREA}_REMOVE`,
    AREA_LIST                                       : `${BASE_ACTIONS}_${AREA}_LIST`,

    DOCS_INSERT                                     : `${BASE_ACTIONS}_${DOC}_INSERT`,
    DOCS_UPDATE                                     : `${BASE_ACTIONS}_${DOC}_UPDATE`,
    DOCS_REMOVE                                     : `${BASE_ACTIONS}_${DOC}_REMOVE`,
    DOCS_LIST                                       : `${BASE_ACTIONS}_${DOC}_LIST`,

}

exports.CF_ACTIONS_INSPECTION = CF_ACTIONS_INSPECTION;