/**
 * Packages
 */
const crypto                    = require('crypto');
const base64url                 = require('base64url');
const httpRequest               = require('../../../tools/http');
const { generateRandomString }  = require('../../../tools/utils/string_utils');

const BaseModel = require('../../../tools/db/base_model');

const {
    ZALO_OPEN_API_URL,
    ZALO_OA_OAUTH_URL,
    ZALO_OA_APP_ID,
    ZALO_OA_APP_SECRET,
    ZALO_OA_REDIRECT_URI
} = process.env;

class Model extends BaseModel {
    generateUrlRequest(cacher) {
        return new Promise(async resolve => {
            const state = generateRandomString(10);
            const verifier = base64url(crypto.randomBytes(32));
            const codeChallenge = base64url(crypto.createHash('sha256').update(verifier).digest());

            const urlRequest = `${ZALO_OA_OAUTH_URL}/v4/oa/permission?app_id=${ZALO_OA_APP_ID}&redirect_uri=${encodeURIComponent(ZALO_OA_REDIRECT_URI)}&code_challenge=${codeChallenge}&state=${state}`;

            // Cache in 5 minutes
            await cacher.set(`ZALO:oa:verifier:${state}`, verifier, 5 * 1000);

            resolve({
                error: false,
                data: urlRequest
            })
        });
    }

    requestToken({ code_challenge, authCode, state, cacher }) {
        return new Promise(async resolve => {
            try {
                const verifierCacheKey = `ZALO:oa:verifier:${state}`;
                const verifier = await cacher.get(verifierCacheKey);
                if(!verifier) {
                    return resolve({ error: true, message: 'Request is expired' });
                }
                await cacher.del(verifierCacheKey);

                const codeChallenge = base64url(crypto.createHash('sha256').update(verifier).digest());

                if(code_challenge !== codeChallenge) {
                    return resolve({ error: true, message: 'Code challenge is not match!'});
                }

                const response = await httpRequest.post(`${ZALO_OA_OAUTH_URL}/v4/oa/access_token`, {
                    app_id: ZALO_OA_APP_ID,
					code: authCode,
					code_verifier: verifier,
					grant_type: 'authorization_code',
                }, {
                    headers: {
						secret_key: ZALO_OA_APP_SECRET,
						'Content-type': 'application/x-www-form-urlencoded',
					},
                });
                if(response.status !== 200 || response.statusText !== 'OK') {
                    return resolve({ error: true, message: "Can't request to zalo" });
                }

                const { access_token, refresh_token } = response.data;

                /**
                 * Cache refresh token in 60 days
                 * and token is 24h
                 */
                await cacher.set(`ZALO:oa:token`, access_token, 24 * 60 * 60);
                await cacher.set(`ZALO:oa:refresh_token`, refresh_token, 24 * 60 * 60 * 60);

                resolve({ error: false, message: 'OK' });
            } catch(error) {
                resolve({ error: true, message: error.message });
            }
        })
    }

    renewAccessToken({ cacher, isCache = false }) {
        return new Promise(async resolve => {
            try {
                const refreshToken = await cacher.get(`ZALO:oa:refresh_token`);
                if(!refreshToken) {
                    return resolve({ error: true, message: 'Refresh token is required' });
                }

                const response = await httpRequest.post(`${ZALO_OA_OAUTH_URL}/v4/oa/access_token`, {
                    app_id: ZALO_OA_APP_ID,
					refresh_token: refreshToken,
					grant_type: 'refresh_token',
                }, {
                    headers: {
						secret_key: ZALO_OA_APP_SECRET,
						'Content-type': 'application/x-www-form-urlencoded',
					},
                });
                if(response.status !== 200 || response.statusText !== 'OK') {
                    return resolve({ error: true, message: "Can't request to zalo" });
                }

                if(isCache) {
                    const { access_token, refresh_token } = response.data;

                    /**
                     * Cache refresh token in 60 days
                     * and token is 24h
                     */
                    await cacher.set(`ZALO:oa:token`, access_token, 24 * 60 * 60);
                    await cacher.set(`ZALO:oa:refresh_token`, refresh_token, 24 * 60 * 60 * 60);
                }

                resolve(response.data);
            } catch(error) {
                resolve({ error: true, message: error.message });
            }
        })
    }

    sendMessage({ text, userId, cacher }) {
        return new Promise(async resolve => {
            try {
                const token = await cacher.get(`ZALO:oa:token`);
                if(!token) {
                    return resolve({ error: true, message: 'Token is required' });
                }

                const response = await httpRequest.post(`${ZALO_OPEN_API_URL}/v2.0/oa/message`, {
                    recipient: {
						user_id: userId,
					},
					message: {
						text,
					},
                }, {
                    headers: {
						access_token: token,
						'Content-type': 'application/json',
					},
                });
                if(response.status !== 200 || response.statusText !== 'OK') {
                    return resolve({ error: true, message: "Can't request to zalo" });
                }

                resolve(response.data);
            } catch(error) {
                resolve({ error: true, message: error.message });
            }
        })
    }
}

exports.MODEL = new Model;