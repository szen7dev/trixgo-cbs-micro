"use strict";

const _2faSession = new (require('./intalize/session'))('2faSession');

module.exports = {
    saveIsValid2fa(session, isValid2fa){
        _2faSession.saveSession(session, {
            isValid2fa
        });
    },

    getIsValid2fa(session) {
        return _2faSession.getSession(session);
    },
};