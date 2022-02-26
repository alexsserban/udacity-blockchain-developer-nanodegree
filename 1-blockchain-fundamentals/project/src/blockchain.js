/**
 *                          Blockchain Class
 *  The Blockchain class contain the basics functions to create your own private blockchain
 *  It uses libraries like `crypto-js` to create the hashes for each block and `bitcoinjs-message`
 *  to verify a message signature. The chain is stored in the array
 *  `this.chain = [];`. Of course each time you run the application the chain will be empty because and array
 *  isn't a persisten storage method.
 *
 */

const SHA256 = require("crypto-js/sha256");
const bitcoinMessage = require("bitcoinjs-message");
const BlockClass = require("./block.js");
const { getTimeUTC } = require("../helpers");
class Blockchain {
    /**
     * Constructor of the class, you will need to setup your chain array and the height
     * of your chain (the length of your chain array).
     * Also everytime you create a Blockchain class you will need to initialized the chain creating
     * the Genesis Block.
     * The methods in this class will always return a Promise to allow client applications or
     * other backends to call asynchronous functions.
     */
    constructor() {
        this.chain = [];
        this.height = -1;
        this.initializeChain();
    }

    /**
     * This method will check for the height of the chain and if there isn't a Genesis Block it will create it.
     * You should use the `addBlock(block)` to create the Genesis Block
     * Passing as a data `{data: 'Genesis Block'}`
     */
    async initializeChain() {
        if (this.height === -1) {
            const block = new BlockClass.Block({ data: "Genesis Block" });
            await this._addBlock(block);
        }
    }

    /**
     * Utility method that return a Promise that will resolve with the height of the chain
     */
    getChainHeight() {
        return new Promise((resolve, reject) => {
            resolve(this.height);
        });
    }

    /**
     * _addBlock(block) will store a block in the chain
     * @param {*} block
     * The method will return a Promise that will resolve with the block added
     * or reject if an error happen during the execution.
     * You will need to check for the height to assign the `previousBlockHash`,
     * assign the `timestamp` and the correct `height`...At the end you need to
     * create the `block hash` and push the block into the chain array. Don't for get
     * to update the `this.height`
     * Note: the symbol `_` in the method name indicates in the javascript convention
     * that this method is a private method.
     */
    _addBlock(block) {
        return new Promise(async (resolve, reject) => {
            try {
                if (this.height >= 0) {
                    block.previousBlockHash = this.chain[this.height].hash;
                }

                this.height += 1;

                block.height = this.height;
                block.time = getTimeUTC();
                block.hash = SHA256(JSON.stringify(block)).toString();
                this.chain.push(block);

                const chainErrorLog = await this.validateChain();
                if (chainErrorLog.length) {
                    reject(chainErrorLog);
                } else {
                    resolve(block);
                }
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * The requestMessageOwnershipVerification(address) method
     * will allow you  to request a message that you will use to
     * sign it with your Bitcoin Wallet (Electrum or Bitcoin Core)
     * This is the first step before submit your Block.
     * The method return a Promise that will resolve with the message to be signed
     * @param {*} address
     */
    requestMessageOwnershipVerification(address) {
        return new Promise((resolve) => {
            const time = getTimeUTC();
            resolve(`${address}:${time}:starRegistry`);
        });
    }

    /**
     * The submitStar(address, message, signature, star) method
     * will allow users to register a new Block with the star object
     * into the chain. This method will resolve with the Block added or
     * reject with an error.
     * Algorithm steps:
     * 1. Get the time from the message sent as a parameter example: `parseInt(message.split(':')[1])`
     * 2. Get the current time: `let currentTime = parseInt(new Date().getTime().toString().slice(0, -3));`
     * 3. Check if the time elapsed is less than 5 minutes
     * 4. Verify the message with wallet address and signature: `bitcoinMessage.verify(message, address, signature)`
     * 5. Create the block and add it to the chain
     * 6. Resolve with the block added.
     * @param {*} address
     * @param {*} message
     * @param {*} signature
     * @param {*} star
     */
    submitStar(address, message, signature, star) {
        return new Promise(async (resolve, reject) => {
            const messageTime = message.split(":")[1];
            const currentTime = getTimeUTC();
            const diff = (parseInt(currentTime) - parseInt(messageTime)) / 60;

            if (diff >= 5) {
                reject("Not Allowed! 5 minutes passed since you requested the validation message.");
                return;
            }

            // Electrum segwit signature supported
            const isSigned = bitcoinMessage.verify(message, address, signature, null, true);
            if (!isSigned) {
                reject("Not Allowed! Message isn't signed by this address.");
                return;
            }

            const blockData = { owner: address, star };
            const newBlock = new BlockClass.Block({ data: blockData });
            try {
                const block = await this._addBlock(newBlock);
                resolve(block);
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block
     *  with the hash passed as a parameter.
     * Search on the chain array for the block that has the hash.
     * @param {*} hash
     */
    getBlockByHash(hash) {
        return new Promise((resolve, reject) => {
            const block = this.chain.find((block) => block.hash == hash);
            resolve(block);
        });
    }

    /**
     * This method will return a Promise that will resolve with the Block object
     * with the height equal to the parameter `height`
     * @param {*} height
     */
    getBlockByHeight(height) {
        return new Promise((resolve, reject) => {
            const block = this.chain.find((p) => p.height === height);
            resolve(block);
        });
    }

    /**
     * This method will return a Promise that will resolve with an array of Stars objects existing in the chain
     * and are belongs to the owner with the wallet address passed as parameter.
     * Remember the star should be returned decoded.
     * @param {*} address
     */
    getStarsByWalletAddress(address) {
        let stars = [];
        return new Promise((resolve, reject) => {
            for (const block of this.chain) {
                const data = block.getBData();
                if (!data || data.owner != address) continue;

                stars.push(data);
            }

            if (!stars.length) resolve(null);
            resolve(stars);
        });
    }

    /**
     * This method will return a Promise that will resolve with the list of errors when validating the chain.
     * Steps to validate:
     * 1. You should validate each block using `validateBlock`
     * 2. Each Block should check the with the previousBlockHash
     */
    validateChain() {
        let errorLog = [];
        let isBlockValid = false;

        return new Promise(async (resolve, reject) => {
            for (const [index, block] of this.chain.entries()) {
                isBlockValid = await block.validate();

                if (!isBlockValid) {
                    errorLog.push({ height: block.height, message: "Block has been tampered." });
                }

                if (block.previousBlockHash != this.chain[index - 1]?.hash) {
                    errorLog.push({ height: block.height, message: "Chain broken" });
                }
            }

            resolve(errorLog);
        });
    }
}

module.exports.Blockchain = Blockchain;
