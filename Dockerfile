FROM node:14-alpine

WORKDIR /usr/src/app

COPY . /usr/src/app

CMD ["yarn", "node", "app.js"]
