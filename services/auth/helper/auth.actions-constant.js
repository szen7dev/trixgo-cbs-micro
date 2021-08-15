// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_AUTH';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const COMPANY = 'COMPANY',
      USER     = 'USER';
/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_AUTH = {
    /**
     * USER
     */
    REGISTER        					: `${BASE_ACTIONS}_${USER}_REGISTER`,
    LOGIN           					: `${BASE_ACTIONS}_${USER}_LOGIN`,
    GET_INFO        					: `${BASE_ACTIONS}_${USER}_GET_INFO`,

    UPDATE_DEVICE_WHEN_LOGIN_MOBILE     : `${BASE_ACTIONS}_${USER}_UPDATE_DEVICE_WHEN_LOGIN_MOBILE`,
    RESOLVE_TOKEN                       : `${BASE_ACTIONS}_${USER}_RESOLVE_TOKEN`,

    SEARCH_WITH_FIND                    : `${BASE_ACTIONS}_${USER}_SEARCH_WITH_FIND`,
    SEARCH_WITH_FULL_TEXT               : `${BASE_ACTIONS}_${USER}_SEARCH_WITH_FULL_TEXT`,

	/**
	 * CHATTING
	 */
    UPDATE_PIN_CONVERSATION            	: `${BASE_ACTIONS}_${USER}_UPDATE_PIN_CONVERSATION`,
}

exports.CF_ACTIONS_AUTH = CF_ACTIONS_AUTH;