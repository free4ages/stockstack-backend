FROM nikolaik/python-nodejs:python3.9-nodejs16-alpine
RUN apk update && apk --no-cache --update add build-base

RUN mkdir -p /usr/src/node-app && chown -R pn:pn /usr/src/node-app

WORKDIR /usr/src/node-app

COPY package.json yarn.lock ./

USER pn

RUN yarn install --pure-lockfile

COPY --chown=pn:pn . .

EXPOSE 3000

