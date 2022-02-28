const Web3 = require("web3");
const { Transaction } = require("@ethereumjs/tx");

const main = async () => {
    const web3 = new Web3("HTTP://127.0.0.1:7545");

    // Set the sending and receiving addresses for the transaction.
    const sendingAddress = "0x0F23343dD260baD61f2cbCA3a5AE53B7bc7903cc";
    const receivingAddress = "0x477024630465EeAD7c1c451377c5BBd2fadcB436";

    // Check the balances of each address
    // const sendingAddressBalance = await web3.eth.getBalance(sendingAddress);
    // console.log("Sender Balance: ", sendingAddressBalance);
    // const receivingAddressBalance = await web3.eth.getBalance(receivingAddress);
    // console.log("Receiver Balance: ", receivingAddressBalance);

    // Set up the transaction
    var txRaw = {
        nonce: web3.utils.toHex(4),
        to: receivingAddress,
        gasPrice: web3.utils.toHex(20000000),
        gasLimit: web3.utils.toHex(30000),
        value: web3.utils.toHex(web3.utils.toWei("1", "ether")),
        data: web3.utils.toHex(""),
    };

    // Sign the transaction with the Hex value of the private key of the sender
    const privateKeySender = "af6fa5fbfd482272557d71f99711431609a4976a5f2d649f08fe6f748c531c82";
    const privateKeySenderHex = Buffer.from(privateKeySender, "hex");
    const tx = Transaction.fromTxData(txRaw);
    const signedTx = tx.sign(privateKeySenderHex);

    //  Send the serialized signed transaction to the Ethereum network.
    const serializedTransaction = signedTx.serialize();
    web3.eth.sendSignedTransaction(serializedTransaction);
};

main();
