// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../coffeecore/Ownable.sol";
import "../coffeeaccesscontrol/FarmerRole.sol";
import "../coffeeaccesscontrol/DistributorRole.sol";
import "../coffeeaccesscontrol/RetailerRole.sol";
import "../coffeeaccesscontrol/ConsumerRole.sol";

// Define a contract 'Supplychain'
contract SupplyChain is
    Ownable,
    FarmerRole,
    DistributorRole,
    RetailerRole,
    ConsumerRole
{
    // Define a variable called 'upc' for Universal Product Code (UPC)
    uint256 upc;

    // Define a variable called 'sku' for Stock Keeping Unit (SKU)
    uint256 sku;

    // Define a public mapping 'items' that maps the UPC to an Item.
    mapping(uint256 => Item) items;

    // Define a public mapping 'itemsHistory' that maps the UPC to an array of TxHash,
    // that track its journey through the supply chain -- to be sent from DApp.
    mapping(uint256 => string[]) itemsHistory;

    // Define enum 'State' with the following values:
    enum State {
        Harvested,
        Processed,
        Packed,
        ForSale,
        Sold,
        Shipped,
        Received,
        Purchased
    }

    State constant defaultState = State.Harvested;

    // Define a struct 'Item' with the following fields:
    struct Item {
        uint256 sku; // Stock Keeping Unit (SKU)
        address ownerID; // Metamask-Ethereum address of the current owner as the product moves through 8 stages
        address originFarmerID; // Metamask-Ethereum address of the Farmer
        string originFarmName; // Farmer Name
        string originFarmInformation; // Farmer Information
        string originFarmLatitude; // Farm Latitude
        string originFarmLongitude; // Farm Longitude
        uint256 productID; // Product ID potentially a combination of upc + sku
        string productImage; // Product Image from IPFS Infura
        string productNotes; // Product Notes
        uint256 productPrice; // Product Price
        State itemState; // Product State as represented in the enum above
        address distributorID; // Metamask-Ethereum address of the Distributor
        address retailerID; // Metamask-Ethereum address of the Retailer
        address consumerID; // Metamask-Ethereum address of the Consumer
    }

    // Define 8 events with the same 8 state values and accept 'upc' as input argument
    event Harvested(uint256 upc);
    event Processed(uint256 upc);
    event Packed(uint256 upc);
    event ForSale(uint256 upc);
    event Sold(uint256 upc);
    event Shipped(uint256 upc);
    event Received(uint256 upc);
    event Purchased(uint256 upc);

    // Define a modifer that verifies the Caller
    modifier verifyCaller(address _address) {
        require(msg.sender == _address, "Not the expected caller");
        _;
    }

    // Define a modifier that checks if the paid amount is sufficient to cover the price
    modifier paidEnough(uint256 _price) {
        require(msg.value >= _price, "Didn't paid enough");
        _;
    }

    // Define a modifier that checks the price and refunds the remaining balance
    modifier checkValue(uint256 _upc) {
        _;
        uint256 _price = items[_upc].productPrice;
        uint256 amountToReturn = msg.value - _price;
        payable(msg.sender).transfer(amountToReturn);
    }

    // Define a modifier that checks if an item.state of a upc is Harvested
    modifier harvested(uint256 _upc) {
        require(
            items[_upc].itemState == State.Harvested,
            "Item is not Harvested."
        );
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Processed
    modifier processed(uint256 _upc) {
        require(
            items[_upc].itemState == State.Processed,
            "Item is not Processed."
        );
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Packed
    modifier packed(uint256 _upc) {
        require(items[_upc].itemState == State.Packed, "Item is not Packed.");
        _;
    }

    // Define a modifier that checks if an item.state of a upc is ForSale
    modifier forSale(uint256 _upc) {
        require(items[_upc].itemState == State.ForSale, "Item is not ForSale.");
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Sold
    modifier sold(uint256 _upc) {
        require(items[_upc].itemState == State.Sold, "Item is not Sold.");
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Shipped
    modifier shipped(uint256 _upc) {
        require(items[_upc].itemState == State.Shipped, "Item is not Shipped.");
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Received
    modifier received(uint256 _upc) {
        require(
            items[_upc].itemState == State.Received,
            "Item is not Received."
        );
        _;
    }

    // Define a modifier that checks if an item.state of a upc is Purchased
    modifier purchased(uint256 _upc) {
        require(
            items[_upc].itemState == State.Purchased,
            "Item is not Purchased."
        );
        _;
    }

    constructor() payable {
        sku = 0;
        upc = 0;
    }

    // Define a function 'kill' if required
    function kill() public {
        if (isOwner()) {
            selfdestruct(payable(owner()));
        }
    }

    // Define a function 'harvestItem' that allows a farmer to mark an item 'Harvested'
    function harvestItem(
        address _originFarmerID,
        string memory _originFarmName,
        string memory _originFarmInformation,
        string memory _originFarmLatitude,
        string memory _originFarmLongitude,
        string memory _productNotes,
        string memory _productImage
    ) public onlyFarmer verifyCaller(_originFarmerID) {
        sku += 1;
        upc += 1;

        // Add the new item as part of Harvest
        items[upc].sku = sku;
        items[upc].ownerID = msg.sender;
        items[upc].originFarmerID = _originFarmerID;
        items[upc].originFarmName = _originFarmName;
        items[upc].originFarmInformation = _originFarmInformation;
        items[upc].originFarmLatitude = _originFarmLatitude;
        items[upc].originFarmLongitude = _originFarmLongitude;
        items[upc].productID = sku + upc;
        items[upc].productNotes = _productNotes;
        items[upc].productImage = _productImage;
        items[upc].itemState = State.Harvested;

        // Emit the appropriate event
        emit Harvested(upc);
    }

    // Define a function 'processtItem' that allows a farmer to mark an item 'Processed'
    function processItem(uint256 _upc)
        public
        harvested(_upc)
        verifyCaller(items[_upc].originFarmerID)
    {
        // Update the appropriate fields
        items[_upc].itemState = State.Processed;

        // Emit the appropriate event
        emit Processed(_upc);
    }

    // Define a function 'packItem' that allows a farmer to mark an item 'Packed'
    function packItem(uint256 _upc)
        public
        processed(_upc)
        verifyCaller(items[_upc].originFarmerID)
    {
        // Update the appropriate fields
        items[_upc].itemState = State.Packed;

        // Emit the appropriate event
        emit Packed(_upc);
    }

    // Define a function 'sellItem' that allows a farmer to mark an item 'ForSale'
    function sellItem(uint256 _upc, uint256 _price)
        public
        packed(_upc)
        verifyCaller(items[_upc].originFarmerID)
    {
        // Update the appropriate fields
        items[_upc].itemState = State.ForSale;
        items[_upc].productPrice = _price;

        // Emit the appropriate event
        emit ForSale(_upc);
    }

    // Define a function 'buyItem' that allows the distributor to mark an item 'Sold'
    // Use the above defined modifiers to check if the item is available for sale, if the buyer has paid enough,
    // and any excess ether sent is refunded back to the buyer
    function buyItem(uint256 _upc)
        public
        payable
        forSale(_upc)
        onlyDistributor
        paidEnough(items[_upc].productPrice)
        checkValue(_upc)
    {
        // Update the appropriate fields - ownerID, distributorID, itemState
        items[_upc].ownerID = msg.sender;
        items[_upc].distributorID = msg.sender;
        items[_upc].itemState = State.Sold;

        // Transfer money to farmer
        payable(items[_upc].originFarmerID).transfer(items[_upc].productPrice);

        // emit the appropriate event
        emit Sold(_upc);
    }

    // Define a function 'shipItem' that allows the distributor to mark an item 'Shipped'
    // Use the above modifers to check if the item is sold
    function shipItem(uint256 _upc, address _retailerID)
        public
        sold(_upc)
        verifyCaller(items[_upc].distributorID)
    {
        require(isRetailer(_retailerID), "Didn't provide a valid retailer.");

        // Update the appropriate fields
        items[_upc].itemState = State.Shipped;
        items[_upc].retailerID = _retailerID;

        // Emit the appropriate event
        emit Shipped(_upc);
    }

    // Define a function 'receiveItem' that allows the retailer to mark an item 'Received'
    // Use the above modifiers to check if the item is shipped
    function receiveItem(uint256 _upc)
        public
        shipped(_upc)
        onlyRetailer
        verifyCaller(items[_upc].retailerID)
    {
        // Update the appropriate fields - ownerID, itemState
        items[_upc].ownerID = msg.sender;
        items[_upc].itemState = State.Received;
        items[_upc].productPrice *= 2;

        // Emit the appropriate event
        emit Received(_upc);
    }

    // Define a function 'purchaseItem' that allows the consumer to mark an item 'Purchased'
    // Use the above modifiers to check if the item is received
    function purchaseItem(uint256 _upc)
        public
        payable
        received(_upc)
        onlyConsumer
        paidEnough(items[_upc].productPrice)
        checkValue(_upc)
    {
        // Update the appropriate fields - ownerID, consumerID, itemState
        items[_upc].ownerID = msg.sender;
        items[_upc].consumerID = msg.sender;
        items[_upc].itemState = State.Purchased;

        // Transfer money to retailer
        payable(items[_upc].retailerID).transfer(items[_upc].productPrice);

        // Emit the appropriate event
        emit Purchased(_upc);
    }

    // Define a function 'fetchItemBufferOne' that fetches the data
    function fetchItem(uint256 _upc) public view returns (Item memory) {
        return items[_upc];
    }

    function addTxToHistory(uint256 _upc, string memory _tx) public {
        itemsHistory[_upc].push(_tx);
    }

    function getHistory(uint256 _upc) public view returns (string[] memory) {
        return itemsHistory[_upc];
    }
}
