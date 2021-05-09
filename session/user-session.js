"use strict";

const userSession = new (require('./intalize/session'))('user_trixgo_micro');

module.exports = {
    saveUser(session, { user, token }) {
        userSession.saveSession(session, {
            user, token
        });
    },
    getUser(session) {
        return userSession.getSession(session);
    },
    isLogin(session) {
        return this.getUser(session) !== null;
    },
    isAdmin(session) {
        if (this.getUser(session) === null ){
            return false
        } else {
            return this.getUser(session).role === 0;
        }
    },
    isUser(session) {
        if (this.getUser(session) === null ){
            return false
        } else {
            return this.getUser(session).role === 1;
        }
    },
    
    // Bổ sung các cấu hình phát sinh
    saveAccountingConfig(session, funda, fromTime, toTime) {
        let infoExists = this.getUser(session);
        userSession.saveSession(session, {
            ...infoExists,
            accountingConfig: {
                funda, fromTime, toTime
            }
        })
    },
    // Get cấu hình phát sinh
    getAccountingConfig(session) {
        return userSession.getSession(session) && userSession.getSession(session).accountingConfig || undefined;
    },
    destroySession (session) {
        return userSession.detroySession(session);
    }
};