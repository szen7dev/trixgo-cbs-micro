const BASE_ROUTE = '/document';

const CF_ROUTINGS_DOCUMENT = {
	// ======================== ROUTE - API ===============================

    /// DOCUMENT
    INSERT_DOCUMENT                     		: `${BASE_ROUTE}/insert-document`,
    UPDATE_DOCUMENT                     		: `${BASE_ROUTE}/update-document`,
    GET_LIST_DOCUMENT                     		: `${BASE_ROUTE}/list-document`,
    GET_LIST_STORAGE                     		: `${BASE_ROUTE}/list-storage`,

    /// DOC_TYPE
    GET_LIST_DOCTYPE                     		: `${BASE_ROUTE}/list-doctype`,
    GET_LIST_DOCTYPE_BY_PACKAGE            		: `${BASE_ROUTE}/list-doctype-by-package`,

    /// PACKAGE
    GET_LIST_PACKAGE                     		: `${BASE_ROUTE}/list-package`,
}

exports.CF_ROUTINGS_DOCUMENT = CF_ROUTINGS_DOCUMENT;
