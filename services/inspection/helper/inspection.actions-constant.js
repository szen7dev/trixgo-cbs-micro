// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_INSPECTION';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const DOC_COMMENT           =  'DOC_COMMENT';
const DOC_REACTION          =  'DOC_REACTION';
const AREA                  = 'AREA';
const GROUP                 = 'GROUP';
const AREA_GROUP            = 'AREA_GROUP';
const DOC                   = 'DOCS';
const DOC_CHECKLIST         =  'DOC_CHECKLIST';

// const CASE_2      = 'CASE_2';

const CF_ACTIONS_INSPECTION = {
    AREA_INSERT                                     : `${BASE_ACTIONS}_${AREA}_INSERT`,
    AREA_UPDATE                                     : `${BASE_ACTIONS}_${AREA}_UPDATE`,
    AREA_REMOVE                                     : `${BASE_ACTIONS}_${AREA}_REMOVE`,
    AREA_LIST                                       : `${BASE_ACTIONS}_${AREA}_LIST`,

    GROUP_INSERT                                    : `${BASE_ACTIONS}_${GROUP}_INSERT`,
    GROUP_UPDATE                                    : `${BASE_ACTIONS}_${GROUP}_UPDATE`,
    GROUP_REMOVE                                    : `${BASE_ACTIONS}_${GROUP}_REMOVE`,
    GROUP_LIST                                      : `${BASE_ACTIONS}_${GROUP}_LIST`,

    AREA_GROUP_INSERT                               : `${BASE_ACTIONS}_${AREA_GROUP}_INSERT`,
    AREA_GROUP_UPDATE                               : `${BASE_ACTIONS}_${AREA_GROUP}_UPDATE`,
    AREA_GROUP_REMOVE                               : `${BASE_ACTIONS}_${AREA_GROUP}_REMOVE`,
    AREA_GROUP_LIST                                 : `${BASE_ACTIONS}_${AREA_GROUP}_LIST`,

    DOCS_INSERT                                     : `${BASE_ACTIONS}_${DOC}_INSERT`,
    DOCS_UPDATE                                     : `${BASE_ACTIONS}_${DOC}_UPDATE`,
    DOCS_REMOVE                                     : `${BASE_ACTIONS}_${DOC}_REMOVE`,
    DOCS_LIST                                       : `${BASE_ACTIONS}_${DOC}_LIST`,

    DOC_CHECKLIST_INSERT                            : `${BASE_ACTIONS}_${DOC_CHECKLIST}_INSERT`,
    DOC_CHECKLIST_UPDATE                            : `${BASE_ACTIONS}_${DOC_CHECKLIST}_UPDATE`,
    DOC_CHECKLIST_REMOVE                            : `${BASE_ACTIONS}_${DOC_CHECKLIST}_REMOVE`,
    DOC_CHECKLIST_LIST                              : `${BASE_ACTIONS}_${DOC_CHECKLIST}_LIST`,

    DOC_COMMENT_INSERT                              : `${BASE_ACTIONS}_${DOC_COMMENT}_INSERT`,
    DOC_COMMENT_UPDATE                              : `${BASE_ACTIONS}_${DOC_COMMENT}_UPDATE`,
    DOC_COMMENT_REMOVE                              : `${BASE_ACTIONS}_${DOC_COMMENT}_REMOVE`,
    DOC_COMMENT_LIST                                : `${BASE_ACTIONS}_${DOC_COMMENT}_LIST`,

    DOC_REACTION_INSERT                             : `${BASE_ACTIONS}_${DOC_REACTION}_INSERT`,
    DOC_REACTION_REMOVE                             : `${BASE_ACTIONS}_${DOC_REACTION}_REMOVE`,
    DOC_REACTION_LIST                               : `${BASE_ACTIONS}_${DOC_REACTION}_LIST`,
}

exports.CF_ACTIONS_INSPECTION = CF_ACTIONS_INSPECTION;