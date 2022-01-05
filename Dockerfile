FROM node:14-alpine as builder

COPY . /faucet/

WORKDIR /faucet

RUN  npm install

ENV PATH="/faucet/node_modules/.bin:${PATH}"

#CMD ts-node src/index.ts
