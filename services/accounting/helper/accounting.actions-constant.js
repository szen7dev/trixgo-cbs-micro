// liệt kê các actions của hệ thống
const BASE_ACTIONS = 'ACT_ACCOUNTING';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const VOUCHER  = 'VOUCHER';
const GENERAL_JOURNAL  = 'GENERAL_JOURNAL';

/**
 * nguyên tắc chuyển đổi từ method trong .handler
 *  VD: handler(insertFast) -> action(INSERT_FAST)
 */
const CF_ACTIONS_ACCOUNTING = {

	/// VOUCHER
	INSERT_FULL_VOUCHER                     			: `${BASE_ACTIONS}_${VOUCHER}_INSERT_FULL_VOUCHER`,
	UPDATE_FULL_VOUCHER                     			: `${BASE_ACTIONS}_${VOUCHER}_UPDATE_VOUCHER`,
	REMOVE_VOUCHER                     					: `${BASE_ACTIONS}_${VOUCHER}_REMOVE_VOUCHER`,
    GET_LIST_VOUCHER_OF_COMPANY 						: `${BASE_ACTIONS}_${VOUCHER}_GET_LIST_VOUCHER_OF_COMPANY`,

	// GENERAL GENERAL_JOURNAL
	INSERT_FULL_GENERAL_JOURNAL                    		: `${BASE_ACTIONS}_${VOUCHER}_INSERT_FULL_GENERAL_JOURNAL`,

}

exports.CF_ACTIONS_ACCOUNTING = CF_ACTIONS_ACCOUNTING;