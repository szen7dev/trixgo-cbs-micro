// liệt kê các actions của hệ thống
const BASE_ACTIONS 	 = 'ACT_DOCUMENT';

/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_DOCUMENT = {
	INSERT_DOCUMENT		: `${BASE_ACTIONS}_INSERT_DOCUMENT`,
	UPDATE_DOCUMENT		: `${BASE_ACTIONS}_UPDATE_DOCUMENT`,
	GET_LIST_DOCUMENT	: `${BASE_ACTIONS}_GET_LIST_DOCUMENT`,
}

exports.CF_ACTIONS_DOCUMENT = CF_ACTIONS_DOCUMENT;