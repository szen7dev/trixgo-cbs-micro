const BASE_ROUTE = '/document';

const CF_ROUTINGS_DOCUMENT = {
	// ======================== ROUTE - API ===============================

    /// DOCUMENT
    INSERT_DOCUMENT                     		: `${BASE_ROUTE}/insert-document`,
    UPDATE_DOCUMENT                     		: `${BASE_ROUTE}/update-document`,
    GET_LIST_DOCUMENT                     		: `${BASE_ROUTE}/list-document`,

    /// DOC_TYPE
    GET_LIST_DOCTYPE                     		: `${BASE_ROUTE}/list-doctype`,
}

exports.CF_ROUTINGS_DOCUMENT = CF_ROUTINGS_DOCUMENT;
