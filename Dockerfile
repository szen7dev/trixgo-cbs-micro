FROM node:current-alpine

ENV NODE_ENV=production

WORKDIR /app

# COPY package.json package-lock.json ./
COPY package.json yarn.lock ./

RUN yarn

COPY . .

CMD ["yarn", "dev"]
