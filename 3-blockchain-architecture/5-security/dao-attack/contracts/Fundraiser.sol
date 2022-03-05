// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./Wallet.sol";

contract Fundraiser {
    mapping(address => uint256) public balances;

    constructor() payable {}

    function withdrawCoins() public {
        uint256 withdrawAmount = balances[msg.sender];
        Wallet wallet = Wallet(msg.sender);
        wallet.payout{value: withdrawAmount}();

        // this line is not reached before the next recursion!!
        balances[msg.sender] = 0;
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function contribute() public payable {
        balances[msg.sender] += msg.value;
    }
}
