const Web3 = require("web3");
const { contractAddress, contractAbi } = require("./contract");

const url = "https://mainnet.infura.io/v3/8bba9811c38b4546a5f36d985bbdd0e6";
const address = "0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8";

const main = async () => {
    const web3 = new Web3(url);

    const balanceWei = await web3.eth.getBalance(address, (err, balance) => balance);
    console.log("Balance (Wei): ", balanceWei);

    const balanceETH = await web3.utils.fromWei(balanceWei, "ether");
    console.log("Balance (ETH): ", balanceETH);

    const txCount = await web3.eth.getTransactionCount(address);
    console.log("Transaction count: ", txCount);

    const contract = new web3.eth.Contract(contractAbi, contractAddress);
    console.log("Contract methods: ", contract.methods);
};

main();
