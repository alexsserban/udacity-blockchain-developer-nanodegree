// This script is designed to test the solidity smart contract - SuppyChain.sol -- and the various functions within
const SupplyChain = artifacts.require("SupplyChain");
const truffleAssert = require("truffle-assertions");

// Helper function to assert if the fetched item is as expected
const assertItem = (item, expectedItem) => {
    assert.equal(item[0], expectedItem.sku, "Error: Invalid item SKU");
    assert.equal(item[1], expectedItem.ownerID, "Error: Missing or Invalid ownerID");
    assert.equal(item[2], expectedItem.originFarmerID, "Error: Missing or Invalid originFarmerID");
    assert.equal(item[3], expectedItem.originFarmName, "Error: Missing or Invalid originFarmName");
    assert.equal(item[4], expectedItem.originFarmInformation, "Error: Missing or Invalid originFarmInformation");
    assert.equal(item[5], expectedItem.originFarmLatitude, "Error: Missing or Invalid originFarmLatitude");
    assert.equal(item[6], expectedItem.originFarmLongitude, "Error: Missing or Invalid originFarmLongitude");
    assert.equal(item[7], expectedItem.productID, "Error: Missing or Invalid productID");
    assert.equal(item[8], expectedItem.productImage, "Error: Missing or Invalid productImage");
    assert.equal(item[9], expectedItem.productNotes, "Error: Missing or Invalid productNotes");
    assert.equal(item[10], expectedItem.productPrice, "Error: Missing or Invalid productPrice");
    assert.equal(item[11], expectedItem.itemState, "Error: Missing or Invalid State");
    assert.equal(item[12], expectedItem.distributorID, "Error: Missing or Invalid distributorID");
    assert.equal(item[13], expectedItem.retailerID, "Error: Missing or Invalid retailerID");
    assert.equal(item[14], expectedItem.consumerID, "Error: Missing or Invalid consumerID");
};

contract("SupplyChain", function (accounts) {
    var sku = 1;
    var upc = 1;
    const ownerID = accounts[0];
    const originFarmerID = accounts[1];
    const originFarmName = "John Doe";
    const originFarmInformation = "Yarray Valley";
    const originFarmLatitude = "-38.239770";
    const originFarmLongitude = "144.341490";
    var productID = sku + upc;
    const productNotes = "Best beans for Espresso";
    const productImage = "";
    const productPrice = web3.utils.toWei("1", "ether");
    const retailerProductPrice = 2 * productPrice;
    const distributorID = accounts[2];
    const retailerID = accounts[3];
    const consumerID = accounts[4];
    const emptyAddress = "0x0000000000000000000000000000000000000000";

    const baseExpectedItem = {
        sku,
        ownerID: originFarmerID,
        originFarmerID,
        originFarmName,
        originFarmInformation,
        originFarmLatitude,
        originFarmLongitude,
        productID,
        productImage,
        productNotes,
        productPrice: 0,
        itemState: 0,
        distributorID: emptyAddress,
        retailerID: emptyAddress,
        consumerID: emptyAddress,
    };

    console.log("Accounts used:");
    console.log("Contract Owner: accounts[0] ", accounts[0]);
    console.log("Farmer: accounts[1] ", accounts[1]);
    console.log("Distributor: accounts[2] ", accounts[2]);
    console.log("Retailer: accounts[3] ", accounts[3]);
    console.log("Consumer: accounts[4] ", accounts[4]);

    before(async function () {
        const supplyChain = await SupplyChain.deployed();
        await supplyChain.addFarmer(originFarmerID);
        await supplyChain.addDistributor(distributorID);
        await supplyChain.addRetailer(retailerID);
        await supplyChain.addConsumer(consumerID);
    });

    it("allows a farmer to harvest coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Harvested by calling function harvestItem()
        const result = await supplyChain.harvestItem(
            originFarmerID,
            originFarmName,
            originFarmInformation,
            originFarmLatitude,
            originFarmLongitude,
            productNotes,
            productImage,
            { from: originFarmerID }
        );

        // Check emitted event
        truffleAssert.eventEmitted(result, "Harvested", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, baseExpectedItem);
    });

    it("allows a farmer to process coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Processed by calling function processtItem()
        const result = await supplyChain.processItem(upc, { from: originFarmerID });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Processed", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, { ...baseExpectedItem, itemState: 1 });
    });

    it("allows a farmer to pack coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Packed by calling function packItem()
        const result = await supplyChain.packItem(upc, { from: originFarmerID });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Packed", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, { ...baseExpectedItem, itemState: 2 });
    });

    it("allows farmer to set coffee as sellable", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as ForSale by calling function sellItem()
        const result = await supplyChain.sellItem(upc, productPrice, { from: originFarmerID });

        // Check emitted event
        truffleAssert.eventEmitted(result, "ForSale", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, { ...baseExpectedItem, productPrice, itemState: 3 });
    });

    it("allows a distributor to buy coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Initial balances
        const distributorBalanceBeforeTx = await web3.eth.getBalance(distributorID);
        const farmerBalanceBeforeTx = await web3.eth.getBalance(originFarmerID);

        // Mark an item as Sold by calling function buyItem()
        const result = await supplyChain.buyItem(upc, {
            from: distributorID,
            value: web3.utils.toWei("2", "ether"),
            gasPrice: 0,
        });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Sold", (ev) => ev.upc.toString() == upc.toString());

        // Check distributor balance
        const distributorBalanceAfterTx = await web3.eth.getBalance(distributorID);
        let value = Number(distributorBalanceBeforeTx) - Number(distributorBalanceAfterTx);
        assert.equal(value, productPrice, "Error: Distributor balance is not as expected.");

        // Check farmer balance
        const farmerBalanceAfterTx = await web3.eth.getBalance(originFarmerID);
        value = Number(farmerBalanceAfterTx) - Number(farmerBalanceBeforeTx);
        assert.equal(value, productPrice, "Error: Farmer balance is not as expected.");

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, {
            ...baseExpectedItem,
            ownerID: distributorID,
            productPrice,
            itemState: 4,
            distributorID,
        });
    });

    it("allows a distributor to ship coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Shipped by calling function shipItem()
        const result = await supplyChain.shipItem(upc, retailerID, { from: distributorID });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Shipped", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, {
            ...baseExpectedItem,
            ownerID: distributorID,
            productPrice,
            itemState: 5,
            distributorID,
            retailerID,
        });
    });

    it("allows a retailer to mark coffee received", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Mark an item as Received by calling function receiveItem()
        const result = await supplyChain.receiveItem(upc, { from: retailerID });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Received", (ev) => ev.upc.toString() == upc.toString());

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, {
            ...baseExpectedItem,
            ownerID: retailerID,
            productPrice: retailerProductPrice,
            itemState: 6,
            distributorID,
            retailerID,
        });
    });

    it("allows a consumer to purchase coffee", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Initial balances
        const retailerBalanceBeforeTx = await web3.eth.getBalance(retailerID);
        const consumerBalanceBeforeTx = await web3.eth.getBalance(consumerID);

        // Mark an item as Purchased by calling function purchaseItem()
        const result = await supplyChain.purchaseItem(upc, { from: consumerID, value: 4 * productPrice, gasPrice: 0 });

        // Check emitted event
        truffleAssert.eventEmitted(result, "Purchased", (ev) => ev.upc.toString() == upc.toString());

        // Check retailer balance
        const retailerBalanceAfterTx = await web3.eth.getBalance(retailerID);
        let value = Number(retailerBalanceAfterTx) - Number(retailerBalanceBeforeTx);
        assert.equal(value, retailerProductPrice, "Error: Retailer balance is not as expected.");

        // Check consumer balance
        const consumerBalanceAfterTx = await web3.eth.getBalance(consumerID);
        value = Number(consumerBalanceBeforeTx) - Number(consumerBalanceAfterTx);
        assert.equal(value, retailerProductPrice, "Error: Consumer balance is not as expected.");

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, {
            ...baseExpectedItem,
            ownerID: consumerID,
            productPrice: retailerProductPrice,
            itemState: 7,
            distributorID,
            retailerID,
            consumerID,
        });
    });

    it("allows anyone to fetch item details from blockchain", async () => {
        const supplyChain = await SupplyChain.deployed();

        // Retrieve the just now saved item from blockchain by calling function fetchItem()
        const item = await supplyChain.fetchItem.call(upc);

        // Verify the item
        assertItem(item, {
            ...baseExpectedItem,
            ownerID: consumerID,
            productPrice: retailerProductPrice,
            itemState: 7,
            distributorID,
            retailerID,
            consumerID,
        });
    });

    it("allows to add Tx to history", async () => {
        const supplyChain = await SupplyChain.deployed();
        const tx1 = "0xc921f84dba474fb497d9a604dd1640e36f58c12b799fccdb30e73acc6f13e4c4";
        const tx2 = "0x2d6eaf0e835f6689d5ebc41bb516d74897f1b04580e80c871ccfddaea8441624";

        await supplyChain.addTxToHistory(upc, tx1);
        await supplyChain.addTxToHistory(upc, tx2);

        const history = await supplyChain.getHistory.call(upc);
        assert.deepEqual(history, [tx1, tx2]);
    });
});
