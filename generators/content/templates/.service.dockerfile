FROM node:boron-alpine
RUN npm i -s -g serverless eslint eslint-plugin-chai-expect eslint-plugin-mocha

RUN mkdir /build && cd /build

WORKDIR /build

ADD package.json .
RUN npm i -s
ADD .eslintrc.json .
ADD .eslintignore .
ADD .babelrc .
ADD .babelconfig.js .
ADD .static-namespaces.json .
ADD tools tools
ADD scripts scripts

ADD lib/common lib/common

ARG SERVICE_NAME
ADD lib/services/$SERVICE_NAME lib/services/$SERVICE_NAME
