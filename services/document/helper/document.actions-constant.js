// liệt kê các actions của hệ thống
const BASE_ACTIONS 	 = 'ACT_DOCUMENT';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const DOCUMENT_DOC   = 'DOCUMENT_DOC';

/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_DOCUMENT = {
	INSERT_DOCUMENT		: `${BASE_ACTIONS}_${DOCUMENT_DOC}_INSERT_DOCUMENT`,
	GET_LIST_DOCUMENT	: `${BASE_ACTIONS}_${DOCUMENT_DOC}_GET_LIST_DOCUMENT`,
}

exports.CF_ACTIONS_DOCUMENT = CF_ACTIONS_DOCUMENT;