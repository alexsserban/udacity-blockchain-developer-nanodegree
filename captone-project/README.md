# Real Estate Marketplace

ERC721 Tokens with zk-SNARKs - [OpenSea](https://testnets.opensea.io/collection/udacitycapstonetoken-v2)

## Contracts
  - ZoKrates (zk-SNARKs) Verifier
  - SolnSquareVerifier (inheriting UdacityCapstoneToken)

## Details
 - Used OpenZeppelin contracts: ERC721Enumerable, ERC721URIStorage, Pausable, Ownable.
 - Impleted ZoKrates for zk-SNARKs proof that needs to be provided when minting a new token.

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
