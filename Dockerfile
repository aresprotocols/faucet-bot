FROM node:14-alpine as builder

COPY . /faucet/

WORKDIR /faucet

RUN yarn install

ENV PATH="/faucet/node_modules/.bin:${PATH}"

#ENTRYPOINT ["/usr/bin/env"]

#CMD ts-node src/index.ts
