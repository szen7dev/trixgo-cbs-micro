// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ADMIN';

const BACKUP = 'BACKUP';

/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(getList) -> action(GET_LIST)
 */
const CF_ACTIONS_ADMIN = {
    BACKUP_GET_LIST     : `${BASE_ACTIONS}_${BACKUP}_GET_LIST`,
    BACKUP_GET_URL      : `${BASE_ACTIONS}_${BACKUP}_GET_URL`,
}

exports.CF_ACTIONS_ADMIN = CF_ACTIONS_ADMIN;
