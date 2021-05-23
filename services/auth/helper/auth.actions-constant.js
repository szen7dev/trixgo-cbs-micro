// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_AUTH';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const AUTH__COMPANY = 'COMPANY',
      AUTH_USER     = 'USER';
/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_AUTH = {
    /**
     * COMPANY
     */
    INSERT_FAST: `${BASE_ACTIONS}_${AUTH__COMPANY}_INSERT_FAST`,
}

exports.CF_ACTIONS_AUTH = CF_ACTIONS_AUTH;