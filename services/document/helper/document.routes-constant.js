const BASE_ROUTE = '/document';

/**
 * vì không tách ra thành từng file action (company, user, app, app_role,...) -> cần thêm prefix phía trước
 */
const CONVERSATION = '/document-doc';

const CF_ROUTINGS_DOCUMENT = {
	// ======================== ROUTE - API ===============================

    /// DOCUMENT_DOC
    INSERT_DOCUMENT_DOC                     		: `${BASE_ROUTE}${CONVERSATION}/create-document-doc`,
}

exports.CF_ROUTINGS_DOCUMENT = CF_ROUTINGS_DOCUMENT;