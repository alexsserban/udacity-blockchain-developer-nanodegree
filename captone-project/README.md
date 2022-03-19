# Real Estate Marketplace

## Addresses
  - ZoKrates (zk-SNARKs) Verifier: 0x4F2F0c0E92573f2b2061512bd8875D6E33c947B9
  - SolnSquareVerifier (inheriting UdacityCapstoneToken): 0xE1F7AAC4541276c987D97052Bf590b54B742A5c5
  - OpenSea: https://testnets.opensea.io/collection/udacitycapstonetoken-v2

## Getting started

### Test
  - pnpm (npm) install
  - cd eth-contracts && truffle test

### Deploy locally
  - start Ganache on :7545
  - truffle migrate 

### Deploy Rinkeby
  - cd eth-contracts
  - cp .env.example .env
  - add Infura to .env
  - truffle migrate --network rinkeby --reset

### Versions
  - Node v16.13.1
  - Truffle v5.5.2
  - Ganache v7.0.1
  - Solidity 0.8.13
