FROM node:hydrogen-alpine

WORKDIR /usr/src/app
COPY . .
RUN npm ci --only=prod
RUN apk update
RUN apk add mysql-client

CMD [ "node", "index.js" ]