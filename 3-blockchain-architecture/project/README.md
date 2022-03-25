# Ethereum Dapp for Tracking Items through Supply Chain
Contract Address: 0x87292aA8bC44485ABa731D14442555Fb6dF02aFa

TX: 0xdb705f9d6c417b91fb731c28c432e7cd70692f37ed723d85a6d5437c621c3fef

## Details
 - Implemented 8 total stages to complete the process, from the farmer who can harvest coffee to the end customer who can purchase.
 - Added Access Control for 4 roles: Farmer, Distributor, Retailer, and Consumer.
 - Used IPFS for images.
 - Coffee history can be viewed from the frontend.

Aditional Libraries
  - @truffle/hdwallet-provider -> deploying contract to Rinkeby with Infura
  - dotenv -> use env variables for truffle config
  - truffle-assertions -> test emited events in contract
  - webpack -> frontend app 
  - ipfs-http-client -> upload photos to ipfs via infura 
  - web3 - modules to interact with the Ethereum ecosystem

IPFS
  - used in the frontend app to upload photos, by a Farmer, when he uses the Harvest function
  - hash is stored in the Item struct

Versions
  - Node v16.13.1
  - Truffle v5.5.2
  - Ganache v7.0.1
  - Solidity 0.8.12
  - Web3.js v1.5.3

Frontend informations:
  - Only the owner of the contract can set roles for addresses
  - The app notices when the user changes the metamask account so every time a function is called, the right user sends the request

#### Activity Diagram
![activity-diagram](https://user-images.githubusercontent.com/30747926/157409615-030667ec-63a9-4a72-ad72-ea0c051d735f.png)

#### Sequence Diagram
![Sequence diagram](https://user-images.githubusercontent.com/30747926/157409897-8af265b8-d18f-489c-aebd-b8abc5c7d06a.png)

#### State Diagram
![state-diagram](https://user-images.githubusercontent.com/30747926/157409933-64083273-0fce-4dca-a855-06452fee881d.png)

#### Data Diagram
![data-diagram](https://user-images.githubusercontent.com/30747926/157409957-7d9aecca-5183-454e-8745-825a1807f88f.png)
