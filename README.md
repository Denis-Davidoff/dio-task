# NestJS Demo App


## Description

NestJS + Monobank API

## Project setup

```bash
$ npm install
or
$ yarn install
```

## Setup docker and Redis

Possible to use any local/remote instance of Redis for this project.

If you need to run Redis locally, you can use the following docker-compose file:

```bash
docker-compose up -d
or
npm run init-docker
or
yarn init-docker
```
Redis will be available on localhost:6379

## Configuration with .env file

Create the .env file in the project's root with the following content:

```bash

APP_PORT=3000

REDIS_HOST=localhost
REDIS_PORT=6379

MONOBANK_API_URL=https://api.monobank.ua/bank/currency

MONOBANK_RATES_TTL=60 # Redis cache time in seconds
```

## Compile and run the project

```bash
# development
$ npm run start
or
$ yarn start

# watch mode
$ npm run start:dev
or
yarn start:dev
```

## Swagger API

Swagger API documentation is available at http://localhost:3000/api

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests - not implemented
$ npm run test:e2e

# test coverage, 100% for MonobankService
$ npm run test:cov
```

### Coverage

MonobankService coverage is 100%

src/monobank              |     100 |      100 |     100 |     100 |                   

monobank.service.ts      |     100 |      100 |     100 |     100 |        


