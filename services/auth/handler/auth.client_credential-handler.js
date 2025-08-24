const jwt = require("jsonwebtoken");

const {
  renderStatusCodeAndResponse,
} = require("../../../tools/utils/status_code");
const { JWT_SECRET_KEY } = require("../../../tools/jwt/cf_jwt");

const AUTH__CLIENT_CREDENTIAL_MODEL =
  require("../model/auth.client_credential-model").MODEL;

module.exports = {
  createClient: {
    params: {
      name: { type: "string" },
      scopes: { type: "array" },
      userId: { type: "string" },
    },
    async handler(ctx) {
      try {
        await this.validateEntity(ctx.params);
        const infoUser = ctx.meta.infoUser;
        const { name, scopes, userId } = ctx.params;

        const resultAfterCallHandler =
          await AUTH__CLIENT_CREDENTIAL_MODEL.create({
            name,
            scopes,
            userId,
            userCreate: infoUser._id,
          });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return { error: true, message: error.message };
      }
    },
  },

  verifyClient: {
    visibility: "private",
    params: {
      clientId: { type: "string" },
      clientSecret: { type: "string" },
    },
    async handler(ctx) {
      try {
        await this.validateEntity(ctx.params);
        const { clientId, clientSecret } = ctx.params;

        const resultAfterCallHandler =
          await AUTH__CLIENT_CREDENTIAL_MODEL.verify({
            clientId,
            clientSecret,
          });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return { error: true, message: error.message };
      }
    },
  },

  revokeClient: {
    params: {
      clientId: { type: "string" },
    },
    async handler(ctx) {
      try {
        await this.validateEntity(ctx.params);
        const { clientId } = ctx.params;

        const resultAfterCallHandler =
          await AUTH__CLIENT_CREDENTIAL_MODEL.revoke({ clientId });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return { error: true, message: error.message };
      }
    },
  },

  getClient: {
    params: {
      clientId: { type: "string" },
    },
    async handler(ctx) {
      try {
        await this.validateEntity(ctx.params);
        const { clientId } = ctx.params;

        const resultAfterCallHandler =
          await AUTH__CLIENT_CREDENTIAL_MODEL.getClient({ clientId });

        return renderStatusCodeAndResponse({ resultAfterCallHandler, ctx });
      } catch (error) {
        return { error: true, message: error.message };
      }
    },
  },

  getToken: {
    params: {
      clientId: { type: "string" },
      clientSecret: { type: "string" },
      scope: { type: "string" },
      grandType: { type: "string" },
    },
    async handler(ctx) {
      try {
        await this.validateEntity(ctx.params);
        const { clientId, clientSecret, scope, grandType } = ctx.params;

        if (grandType !== "client_credentials")
          throw new Error("Unsupported grant_type");

        const {
          error,
          data: client,
          ...rest
        } = await AUTH__CLIENT_CREDENTIAL_MODEL.verify({
          clientId,
          clientSecret,
        });
        if (error) return { error, ...rest };

        // Requested scope should be subset of allowed scopes
        const requestedScopes = scope ? scope.split(" ").filter(Boolean) : [];
        const allowedScopes = client.scopes || [];
        const finalScopes = requestedScopes.length
          ? requestedScopes.filter((s) => allowedScopes.includes(s))
          : allowedScopes;

        // Issue JWT
        const payload = {
          sub: client.id,
          clientId: client.clientId,
          scopes: finalScopes,
          infoUser: { _id: client.userId }
        };

        const expiresIn = parseInt(process.env.JWT_EXPIRES_IN || "3600", 10);
        const token = jwt.sign(payload, JWT_SECRET_KEY, { expiresIn });

        return {
          error: false,
          data: {
            accessToken: token,
            tokenType: "Bearer",
            expiresIn: expiresIn,
            scopes: finalScopes,
          },
        };
      } catch (error) {
        return { error: true, message: error.message };
      }
    },
  },
};
