FROM node:boron-alpine
RUN npm i -s -g eslint eslint-plugin-chai-expect eslint-plugin-mocha prettier eslint-config-prettier eslint-plugin-prettier

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

ADD spec spec
ADD .nycrc .
RUN npm i -g coveralls
