import Web3 from "web3";
import SupplyChain from "../../build/contracts/SupplyChain.json";
import { create } from "ipfs-http-client";

const App = {
    web3: null,
    account: null,
    meta: null,

    start: async function () {
        const { web3 } = this;

        try {
            // get contract instance
            const networkId = await web3.eth.net.getId();
            const deployedNetwork = SupplyChain.networks[networkId];

            // const contractAddress = "0x87292aA8bC44485ABa731D14442555Fb6dF02aFa";
            const contractAddress = deployedNetwork.address;

            this.meta = new web3.eth.Contract(SupplyChain.abi, contractAddress);

            const accounts = await web3.eth.getAccounts();
            this.account = accounts[0];
        } catch (error) {
            console.error("Could not connect to contract or chain.");
        }
    },

    grantFarmerAccess: async function () {
        const farmer = document.getElementById("farmer").value;
        const { addFarmer } = this.meta.methods;

        const result = await addFarmer(farmer).send({ from: this.account });

        console.log("Granted Access to Farmer: ", result);
    },

    grantDistributorAccess: async function () {
        const farmer = document.getElementById("distributor").value;
        const { addDistributor } = this.meta.methods;

        const result = await addDistributor(farmer).send({ from: this.account });

        console.log("Granted Access to Distributor: ", result);
    },

    grantRetailerAccess: async function () {
        const farmer = document.getElementById("retailer").value;
        const { addRetailer } = this.meta.methods;

        const result = await addRetailer(farmer).send({ from: this.account });

        console.log("Granted Access to Retailer: ", result);
    },

    grantConsumerAccess: async function () {
        const farmer = document.getElementById("consumer").value;
        const { addConsumer } = this.meta.methods;

        const result = await addConsumer(farmer).send({ from: this.account });

        console.log("Granted Access to Consumer: ", result);
    },

    fetchItem: async function () {
        const fetchItemUpc = document.getElementById("fetchItemUpc").value;

        const { fetchItem } = this.meta.methods;
        const item = await fetchItem(fetchItemUpc).call();
        console.log(`Item with ${fetchItemUpc} UPC: `, item);
    },

    readFileAsync: function (file) {
        return new Promise((resolve, reject) => {
            let reader = new window.FileReader();

            reader.onload = () => {
                resolve(reader.result);
            };

            reader.onerror = reject;

            reader.readAsArrayBuffer(file);
        });
    },

    harvest: async function () {
        const data = document.getElementById("image").files[0];
        let image = await this.readFileAsync(data);

        const client = create("https://ipfs.infura.io:5001/api/v0");
        const created = await client.add(image);
        const url = `https://ipfs.infura.io/ipfs/${created.path}`;
        console.log("Product image available at:", url);

        const farmName = document.getElementById("farmName").value;
        const farmInfo = document.getElementById("farmInfo").value;
        const farmLat = document.getElementById("farmLat").value;
        const farmLong = document.getElementById("farmLong").value;
        const productNotes = document.getElementById("productNotes").value;

        const { harvestItem, addTxToHistory } = this.meta.methods;

        this.meta.events.Harvested().on("data", (event) => {
            addTxToHistory(event.returnValues.upc, result.transactionHash).send({ from: this.account });
        });

        const result = await harvestItem(
            this.account,
            farmName,
            farmInfo,
            farmLat,
            farmLong,
            productNotes,
            created.path
        ).send({
            from: this.account,
        });

        console.log("Harvest Tx: ", result);
    },

    process: async function () {
        const upc = document.getElementById("farmerUpc").value;

        const { processItem, addTxToHistory } = this.meta.methods;
        const result = await processItem(upc).send({ from: this.account });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Process Tx: ", result);
    },

    pack: async function () {
        const upc = document.getElementById("farmerUpc").value;

        const { packItem, addTxToHistory } = this.meta.methods;
        const result = await packItem(upc).send({ from: this.account });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Pack Tx: ", result);
    },

    setForSale: async function () {
        const upc = document.getElementById("farmerUpc").value;
        const priceEther = document.getElementById("farmerPrice").value;
        const priceWei = this.web3.utils.toWei(priceEther, "ether");

        const { sellItem, addTxToHistory } = this.meta.methods;
        const result = await sellItem(upc, priceWei).send({ from: this.account });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Set for sale Tx: ", result);
    },

    buy: async function () {
        const upc = document.getElementById("distributorBuyUpc").value;
        const valueEther = document.getElementById("distributorBuyValue").value;
        const valueWei = this.web3.utils.toWei(valueEther, "ether");

        const { buyItem, addTxToHistory } = this.meta.methods;
        const result = await buyItem(upc).send({
            from: this.account,
            value: valueWei,
        });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Buy Tx: ", result);
    },

    ship: async function () {
        const upc = document.getElementById("distributorShipUpc").value;
        const retailer = document.getElementById("distributorShipRetailer").value;

        const { shipItem, addTxToHistory } = this.meta.methods;
        const result = await shipItem(upc, retailer).send({
            from: this.account,
        });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Ship Tx: ", result);
    },

    receive: async function () {
        const upc = document.getElementById("retailerUpc").value;

        const { receiveItem, addTxToHistory } = this.meta.methods;
        const result = await receiveItem(upc).send({ from: this.account });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Receive Tx: ", result);
    },

    purchase: async function () {
        const upc = document.getElementById("consumerUpc").value;
        const valueEther = document.getElementById("consumerValue").value;
        const valueWei = this.web3.utils.toWei(valueEther, "ether");

        const { purchaseItem, addTxToHistory } = this.meta.methods;
        const result = await purchaseItem(upc).send({
            from: this.account,
            value: valueWei,
        });
        await addTxToHistory(upc, result.transactionHash).send({ from: this.account });

        console.log("Purchase Tx: ", result);
    },

    getHistory: async function () {
        const upc = document.getElementById("historyUpc").value;

        const { getHistory } = this.meta.methods;
        const history = await getHistory(upc).call({
            from: this.account,
        });

        console.log(history);

        const dict = {
            0: "Harvested",
            1: "Processed",
            2: "Packed",
            3: "ForSale",
            4: "Sold",
            5: "Shipped",
            6: "Received",
            7: "Purchased",
        };

        let i = 0;
        while (i < 8) {
            document.getElementById(`history${i}`).innerHTML = history[i] ? `${dict[i]} - ${history[i]}` : "";
            i++;
        }
    },
};

window.App = App;

window.addEventListener("load", async function () {
    if (window.ethereum) {
        // use MetaMask's provider
        App.web3 = new Web3(window.ethereum);
        await window.ethereum.send("eth_requestAccounts"); // get permission to access accounts
    }

    App.start();
});

window.ethereum.on("accountsChanged", function (accounts) {
    App.account = accounts[0];
    console.log("Account changed to: ", App.account);
});
