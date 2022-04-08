const BASE_ROUTE = '/budget';
/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const BUDGET_ITEM               = '/budget_items';
const BUDGET_GROUP              = '/budget_groups';
const BUDGET_WORK               = '/budget_works';
const BUDGET_SUBMITTAL          = '/budget_submittals';

const CF_ROUTINGS_BUDGET = {
    ORIGIN_APP: BASE_ROUTE,

    // ================================BUDGET============================================//
    BUDGET                                                         : `${BASE_ROUTE}`,

    // ================================BUDGET_ITEM============================================//
    BUDGET_ITEM                                                    : `${BASE_ROUTE}${BUDGET_ITEM}`,
    
    // ================================BUDGET_GROUP============================================//
    BUDGET_GROUP                                                   : `${BASE_ROUTE}${BUDGET_GROUP}`,
    
    // ================================BUDGET_WORK============================================//
    BUDGET_WORK                                                    : `${BASE_ROUTE}${BUDGET_WORK}`,
    
    // ================================BUDGET_SUBMITTAL============================================//
    BUDGET_SUBMITTAL                                               : `${BASE_ROUTE}${BUDGET_SUBMITTAL}`,    
}

exports.CF_ROUTINGS_BUDGET = CF_ROUTINGS_BUDGET;