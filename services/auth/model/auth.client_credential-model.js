"use strict";

const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const BaseModel                         = require('../../../tools/db/base_model');
const { KEY_ERROR }                     = require('../../../tools/keys/index');

const AUTH__CLIENT_CREDENTIAL_COLL      = require('../database/auth.client_credential-coll');

class Model extends BaseModel {
    constructor() {
        super(AUTH__CLIENT_CREDENTIAL_COLL)
    }

    create({ name, scopes, userId, userCreate }) {
        return new Promise(async (resolve) => {
            try {
                const clientId = 'client_' + crypto.randomBytes(6).toString('hex');
                const clientSecret = crypto.randomBytes(24).toString('base64url');

                const checkExist = await AUTH__CLIENT_CREDENTIAL_COLL.findOne({
                    clientId
                });

                if (checkExist) {
                    return resolve({ error: true, message: 'Client already exist', keyError: KEY_ERROR.CLIENT_ALREADY_EXIST, status: 400 });
                }

                const saltRounds = bcrypt.genSaltSync(12);
                const hashClientSecret = await bcrypt.hash(clientSecret, saltRounds);

                const infoClientInserted = await this.insertData({
                    clientId, clientSecretHash: hashClientSecret, name, scopes, userCreate, userId
                });
                if (!infoClientInserted) return resolve({ error: true, keyError: 'cannot_insert_client' });

                return resolve({
                    error: false,
                    data: { clientId, clientSecret, name, scopes },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    verify({ clientId, clientSecret }) {
        return new Promise(async (resolve) => {
            try {
                const checkExist = await AUTH__CLIENT_CREDENTIAL_COLL.findOne({
                    clientId
                });

                if (!checkExist) {
                    return resolve({ error: true, message: 'Client not exist', keyError: KEY_ERROR.CLIENT_NOT_EXIST, status: 400 });
                }

                if(checkExist.revoked){
                    return resolve({ error: true, message: 'Client revoked', keyError: KEY_ERROR.CLIENT_REVOKED, status: 400 });
                }

                const hashCompare = await bcrypt.compare(clientSecret, checkExist.clientSecretHash);
                if (!hashCompare) {
                    return resolve({ error: true, message: 'Client secret not match', keyError: KEY_ERROR.CLIENT_SECRET_NOT_MATCH, status: 400 });
                }

                return resolve({
                    error: false,
                    data: { id: checkExist._id, clientId, name: checkExist.name, scopes: checkExist.scopes, userId: checkExist.userId },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    revoke({ clientId }) {
        return new Promise(async (resolve) => {
            try {
                const infoClientUpdated = await AUTH__CLIENT_CREDENTIAL_COLL.findOneAndUpdate({
                    clientId
                }, {
                    revoked: true
                });

                if (!infoClientUpdated) return resolve({ error: true, keyError: 'cannot_update_client' });

                return resolve({
                    error: false,
                    data: { clientId, revoked: true },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }

    getClient({ clientId }) {
        return new Promise(async (resolve) => {
            try {
                const infoClient = await AUTH__CLIENT_CREDENTIAL_COLL.findOne({
                    clientId
                });

                if (!infoClient) return resolve({ error: true, keyError: 'cannot_get_client' });

                return resolve({
                    error: false,
                    data: {
                        clientId, name: infoClient.name, scopes: infoClient.scopes, userId: infoClient.userId, revoked: infoClient.revoked
                    },
                });
            } catch (error) {
                return resolve({ error: true, message: error.message, status: 500 });
            }
        })
    }
}

exports.MODEL = new Model;