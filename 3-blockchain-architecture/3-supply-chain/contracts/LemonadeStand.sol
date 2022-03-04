// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

// Define a contract 'Lemonade Stand'
contract LemonadeStand {
    // Variable: Owner
    address owner;

    // Variable: SKU count
    uint256 skuCount;

    // Event: 'State' with value 'ForSale'
    enum State {
        ForSale,
        Sold,
        Shipped
    }

    // Struct: Item. name, sku, price, state, seller, buyer
    struct Item {
        string name;
        uint256 sku;
        uint256 price;
        State state;
        address seller;
        address buyer;
    }

    // Define a public mapping 'items' that maps the SKU (a number) to an Item.
    mapping(uint256 => Item) items;

    // Events
    event ForSale(uint256 skuCount);
    event Sold(uint256 sku);
    event Shipped(uint256 sku);

    // Modifier: Only Owner see if msg.sender == owner of the contract
    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    // Define a modifier that verifies the Caller
    modifier verifyCaller(address _address) {
        require(msg.sender == _address);
        _;
    }

    // Define a modifier that checks if the paid amount is sufficient to cover the price
    modifier paidEnough(uint256 _price) {
        require(msg.value >= _price);
        _;
    }

    // Define a modifier that checks if an item.state of a sku is ForSale
    modifier forSale(uint256 _sku) {
        require(items[_sku].state == State.ForSale);
        _;
    }

    // Define a modifier that checks if an item.state of a sku is Sold
    modifier sold(uint256 _sku) {
        require(items[_sku].state == State.Sold);
        _;
    }

    // Define a modifier that checks the price and refunds the remaining balance
    modifier checkValue(uint256 _sku) {
        _;
        uint256 _price = items[_sku].price;
        uint256 amountToRefund = msg.value - _price;
        payable(items[_sku].buyer).transfer(amountToRefund);
    }

    constructor() {
        owner = msg.sender;
        skuCount = 0;
    }

    function addItem(string memory _name, uint256 _price) public onlyOwner {
        // Increment sku
        skuCount = skuCount + 1;

        // Emit the appropriate event
        emit ForSale(skuCount);

        // Add the new item into inventory and mark it for sale
        items[skuCount] = Item({
            name: _name,
            sku: skuCount,
            price: _price,
            state: State.ForSale,
            seller: msg.sender,
            buyer: address(0)
        });
    }

    function buyItem(uint256 sku)
        public
        payable
        forSale(sku)
        paidEnough(items[sku].price)
        checkValue(sku)
    {
        address buyer = msg.sender;
        uint256 price = items[sku].price;

        // Update Buyer
        items[sku].buyer = buyer;

        // Update State
        items[sku].state = State.Sold;

        // Transfer money to seller
        payable(items[sku].seller).transfer(price);

        // Emit the appropriate event
        emit Sold(sku);
    }

    // Define a function 'shipItem' that allows the seller to change the state to 'Shipped'
    function shipItem(uint256 sku)
        public
        // Call modifier to check if the item is sold
        sold(sku)
        // Call modifier to check if the invoker is seller
        verifyCaller(items[sku].seller)
    {
        // Update state
        items[sku].state = State.Shipped;
        // Emit the appropriate event
        emit Shipped(sku);
    }

    function fetchItem(uint256 _sku)
        public
        view
        returns (
            string memory name,
            uint256 sku,
            uint256 price,
            string memory stateIs,
            address seller,
            address buyer
        )
    {
        uint256 state;
        name = items[_sku].name;
        sku = items[_sku].sku;
        price = items[_sku].price;
        state = uint256(items[_sku].state);

        if (state == 0) {
            stateIs = "For Sale";
        }

        if (state == 1) {
            stateIs = "Sold";
        }

        if (state == 2) {
            stateIs = "Shipped";
        }

        seller = items[_sku].seller;
        buyer = items[_sku].buyer;
    }
}
