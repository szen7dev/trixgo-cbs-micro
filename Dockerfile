ARG NODE_VERSION=16-alpine
FROM node:${NODE_VERSION}

WORKDIR /app

RUN yarn global add pm2
COPY package.json yarn.lock ./
RUN yarn

ENV NODE_ENV=production

COPY . .

CMD ["pm2", "start", "provisioning/process.config.js"]
