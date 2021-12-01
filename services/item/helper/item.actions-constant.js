// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ITEM';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const CONTRACT          = 'CONTRACT';
const CONTACT           = 'CONTACT';
const DEPARTMENT        = 'DEPARTMENT';

const CF_ACTIONS_ITEM = {
    /**
     * CONTRACT
    */
    UPDATE_CONTRACT_BY_CONDITION             : `${BASE_ACTIONS}_${CONTRACT}_UPDATE_CONTRACT_BY_CONDITION`,
    CONTRACT_GET_LIST                        : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_GET_LIST`,

    /**
     * DEPARTMENT
    */
    DEPARTMENT_GET_LIST                      : `${BASE_ACTIONS}_${DEPARTMENT}_DEPARTMENT_GET_LIST`,

    /**
     * CONTACT
     */
    GET_LIST_CONTACT                         : `${BASE_ACTIONS}_${CONTACT}_GET_LIST_CONTACT`,
    INFO_CONTACT		                     : `${BASE_ACTIONS}_${CONTACT}_INFO_CONTACT`,

	HISTORY_WORK                             : `${BASE_ACTIONS}_${CONTACT}_HISTORY_WORK`,
	EXPERIENCE_WORK                          : `${BASE_ACTIONS}_${CONTACT}_EXPERIENCE_WORK`,
	EXPERIENCE_APPOINTMENT_DECISION          : `${BASE_ACTIONS}_${CONTACT}_EXPERIENCE_APPOINTMENT_DECISION`,
	EDUCATION_LEVEL                          : `${BASE_ACTIONS}_${CONTACT}_EDUCATION_LEVEL`,
	OTHER_CERTIFICATES                       : `${BASE_ACTIONS}_${CONTACT}_OTHER_CERTIFICATES`,
}

exports.CF_ACTIONS_ITEM = CF_ACTIONS_ITEM;
