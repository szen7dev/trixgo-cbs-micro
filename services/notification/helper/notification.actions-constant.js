// liệt kê các actions của hệ thống
const BASE_ACTIONS  = 'ACT_NOTIFICATION';
const LOG           = 'LOG';

const CF_ACTIONS_NOTIFICATION = {
    INSERT_NOTIFICATION                         : `${BASE_ACTIONS}_${LOG}_INSERT`,
    UPDATE_NOTIFICATION                         : `${BASE_ACTIONS}_${LOG}_UPDATE`,
    GET_INFO_AND_GET_LIST_NOTIFICATION          : `${BASE_ACTIONS}_${LOG}_GET_INFO_AND_GET_LIST`,
}

exports.CF_ACTIONS_NOTIFICATION = CF_ACTIONS_NOTIFICATION;