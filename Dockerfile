FROM node:18-alpine

WORKDIR /app

RUN yarn global add pm2
COPY package.json yarn.lock ./
RUN yarn

ENV NODE_ENV=production
# Congfigure New Relic, License Key is set in the secret manager
ENV NEW_RELIC_APP_NAME=cbs-micro
ENV NEW_RELIC_NO_CONFIG_FILE=true
ENV NEW_RELIC_DISTRIBUTED_TRACING_ENABLED=true
ENV NEW_RELIC_LOG=stdout

COPY . .

CMD ["pm2-runtime", "provisioning/process.config.js"]
