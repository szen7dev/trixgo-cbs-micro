// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_INSPECTION';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const TEMPLATE_DOC      = 'TEMPLATE_DOC';
// const CASE_2      = 'CASE_2';

const CF_ACTIONS_INSPECTION = {
    TEMPLATE_DOC_INSERT                             : `${BASE_ACTIONS}_${TEMPLATE_DOC}_INSERT`,
    TEMPLATE_DOC_GET_LIST                           : `${BASE_ACTIONS}_${TEMPLATE_DOC}_GET_LIST`,
}

exports.CF_ACTIONS_INSPECTION = CF_ACTIONS_INSPECTION;