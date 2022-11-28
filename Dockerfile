ARG NODE_VERSION=16-alpine
FROM node:${NODE_VERSION}

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn

ENV NODE_ENV=production

COPY . .

CMD ["yarn", "dev"]
