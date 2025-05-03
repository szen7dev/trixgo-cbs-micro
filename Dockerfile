FROM node:18-alpine

WORKDIR /app

RUN yarn global add pm2
COPY package.json yarn.lock ./
RUN yarn

ENV NODE_ENV=production

COPY . .

CMD ["pm2-runtime", "provisioning/process.config.js"]
