// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ITEM';
/**
 * CASE_1, CASE_2 tương ứng trong phần AUTH SERVICE, có 2 coll: user, company
 */
const CONTRACT          = 'CONTRACT';
const CONTACT           = 'CONTACT';
const DEPARTMENT        = 'DEPARTMENT';
const DOCTYPE           = 'DOCTYPE';
const WAREHOUSE         = 'WAREHOUSE';
const AREA              = 'AREA';
const POSITION          = 'POSITION';
const STORAGE           = 'STORAGE';
const ACCOUNT           = 'STORAGE';
const FUNDA             = 'FUNDA';

const CF_ACTIONS_ITEM = {
    /**
     * CONTRACT
    */
    UPDATE_CONTRACT_BY_CONDITION             : `${BASE_ACTIONS}_${CONTRACT}_UPDATE_CONTRACT_BY_CONDITION`,
    CONTRACT_GET_LIST                        : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_GET_LIST`,
    
    CONTRACT_INSERT                          : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_INSERT`,
    CONTRACT_UPDATE                          : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_UPDATE`,
    CONTRACT_REMOVE                          : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_REMOVE`,
    CONTRACT_GET_INFO_AND_GET_LIST           : `${BASE_ACTIONS}_${CONTRACT}_CONTRACT_GET_INFO_AND_GET_LIST`,

    /**
     * DEPARTMENT
    */
    DEPARTMENT_INSERT                        : `${BASE_ACTIONS}_${DEPARTMENT}_DEPARTMENT_INSERT`,
    DEPARTMENT_UPDATE                        : `${BASE_ACTIONS}_${DEPARTMENT}_DEPARTMENT_UPDATE`,
    DEPARTMENT_GET_LIST                      : `${BASE_ACTIONS}_${DEPARTMENT}_DEPARTMENT_GET_LIST`,
    DEPARTMENT_ANALYSIS_ONTIME_ON_BUDGET     : `${BASE_ACTIONS}_${DEPARTMENT}_ANALYSIS_ONTIME_ON_BUDGET`,

    /**
     * DOCTYPE
     */
    DOCTYPE_GET_INFO_AND_GET_LIST           : `${BASE_ACTIONS}_${DOCTYPE}_GET_INFO_AND_GET_LIST`,

     /**
     * CONTACT
     */
    CONTACT_INSERT                          : `${BASE_ACTIONS}_${CONTACT}_INSERT`,
    CONTACT_UPDATE                          : `${BASE_ACTIONS}_${CONTACT}_UPDATE`,
    CONTACT_REMOVE                          : `${BASE_ACTIONS}_${CONTACT}_REMOVE`,
    CONTACT_GET_INFO_AND_GET_LIST           : `${BASE_ACTIONS}_${CONTACT}_GET_INFO_AND_GET_LIST`,

    /**
     * WAREHOUSE
     */
    WAREHOUSE_GET_INFO_AND_GET_LIST           : `${BASE_ACTIONS}_${WAREHOUSE}_GET_INFO_AND_GET_LIST`,

    /**
     * AREA 
     */
    AREA_GET_INFO_AND_GET_LIST              : `${BASE_ACTIONS}_${AREA}_GET_INFO_AND_GET_LIST`,

    /**
     * POSITION 
     */
    POSITION_GET_INFO_AND_GET_LIST              : `${BASE_ACTIONS}_${POSITION}_GET_INFO_AND_GET_LIST`,

    /**
     * STORAGE 
     */
    STORAGE_GET_INFO_AND_GET_LIST               : `${BASE_ACTIONS}_${STORAGE}_GET_INFO_AND_GET_LIST`, 
    
    /**
    * ACCOUNT  
    */
    ACCOUNT_GET_INFO_WITH_NAME         : `${BASE_ACTIONS}_${ACCOUNT}_ACCOUNT_GET_INFO_WITH_NAME`,
    ACCOUNT_GET_INFO_WITH_ID           : `${BASE_ACTIONS}_${ACCOUNT}_ACCOUNT_GET_INFO_WITH_ID`,
    ACCOUNT_GET_LIST_NESTED            : `${BASE_ACTIONS}_${ACCOUNT}_ACCOUNT_GET_LIST_NESTED`,
    
    /**
    * FUNDA  
    */
   FUNDA_GET_LIST_BY_COMPANY_USER       : `${BASE_ACTIONS}_${FUNDA}_FUNDA_GET_LIST_BY_COMPANY_USER`

}

exports.CF_ACTIONS_ITEM = CF_ACTIONS_ITEM;
