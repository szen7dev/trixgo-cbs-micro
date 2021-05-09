const _ = require('lodash');
const fs = require('fs');

const ApiGateway = require('moleculer-web');
const { MoleculerServerError } = require('moleculer').Errors;
const defaultsDeep = require('lodash.defaultsdeep');
const merge = require('lodash.merge');
const forIn = require('lodash.forin');
const isObject = require('lodash.isobject');
const cloneDeep = require('lodash.clonedeep');
const set = require('lodash.set');

const SwaggerUI = require('swagger-ui-dist');

module.exports = function (mixinOptions) {

  mixinOptions = defaultsDeep(mixinOptions, {
    routeOptions: {
      path: '/openapi',
    },
    schema: null
  });

  let shouldUpdateSchema = true;
  let schema = null;

  return {
    events: {
      '$services.changed'() { this.invalidateOpenApiSchema(); },
    },

    methods: {
      /**
       * Invalidate the generated OpenAPI schema
       */
      invalidateOpenApiSchema() {
        shouldUpdateSchema = true;
      },

      /**
       * Generate OpenAPI Schema
       */
      generateOpenAPISchema() {
        try {
          const res = defaultsDeep(mixinOptions.schema, {
            openapi: '3.0.1',

            // https://swagger.io/specification/#infoObject
            // https://swagger.io/specification/#serverObject
            servers: [
              { 
                url: `${this.isHTTPS ? 'https' : 'http'}://localhost:${this.server.address().port}/api/v1`,
                description: 'Development server'
              },
              {
                url: `https://api.platfox.com`,
                description: 'Production Server'
              }
            ],

            // https://swagger.io/specification/#componentsObject
            components: {
            },

            // https://swagger.io/specification/#pathsObject
            paths: {
            },

            // https://swagger.io/specification/#securityRequirementObject
            security: [],

            // https://swagger.io/specification/#tagObject
            tags: [
              {
                name: 'sites',
                description: 'sites operations'
              }
            ],

            // https://swagger.io/specification/#externalDocumentationObject
            externalDocs: []
          });

          const services = this.broker.registry.getServiceList({ withActions: true });
          services.forEach(service => {

            // --- COMPILE SERVICE-LEVEL DEFINITIONS ---
            if (service.settings.openapi) {
              merge(res, service.settings.openapi);
            }

            // --- COMPILE ACTION-LEVEL DEFINITIONS ---
            forIn(service.actions, action => {
              if (action.openapi) {
                if (isObject(action.openapi)) {
                  let def = cloneDeep(action.openapi);
                  let method, routePath;
                  if (def.$path) {
                    const p = def.$path.split(' ');
                    method = p[0].toLowerCase();
                    routePath = p[1];
                    delete def.$path;
                  }

                  set(res.paths, [routePath, method], def);
                }
              }
            });

          });

          return res;

        } catch (err) {
          throw new MoleculerServerError('Unable to compile OpenAPI schema', 500, 'UNABLE_COMPILE_OPENAPI_SCHEMA', { err });
        }
      }
    },

    created() {
      const pathToSwaggerUI = SwaggerUI.absolutePath();
      const route = defaultsDeep(mixinOptions.routeOptions, {
        use: [
          ApiGateway.serveStatic(pathToSwaggerUI)
        ],

        aliases: {

          'GET /openapi.json'(req, res) {
            // Send back the generated schema
            if (shouldUpdateSchema || !schema) {
              // Create new server & regenerate GraphQL schema
              this.logger.info('♻ Regenerate OpenAPI/Swagger schema...');

              try {
                schema = this.generateOpenAPISchema();

                shouldUpdateSchema = false;

                this.logger.info(schema);
                if (process.env.NODE_ENV != 'production')
                  fs.writeFileSync('./openapi.json', JSON.stringify(schema, null, 4), 'utf8');
              } catch (err) {
                this.logger.warn(err);
                this.sendError(req, res, err);
              }
            }

            const ctx = req.$ctx;
            ctx.meta.responseType = 'application/json';

            return this.sendResponse(req, res, schema);
          }
        },

        mappingPolicy: 'restrict',
      });

      // Add route
      this.settings.routes.unshift(route);
    },

    started() {
      this.logger.info(`📜 OpenAPI Docs server is available at ${mixinOptions.routeOptions.path}`);
    }
  };
};