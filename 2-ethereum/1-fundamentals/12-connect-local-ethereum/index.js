const Web3 = require("web3");

const url = "HTTP://127.0.0.1:7545";

const main = async () => {
    const web3 = new Web3(url);

    const accounts = await web3.eth.getAccounts();
    console.log("Accounts: ", accounts);

    const account = accounts[0];
    const balanceWei = await web3.eth.getBalance(account);
    const balanceETH = await web3.utils.fromWei(balanceWei, "ether");
    console.log("Account Balance: ", balanceETH);
};

main();
