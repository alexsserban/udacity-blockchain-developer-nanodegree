// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract Modifiers {
    uint256 public minBid;

    constructor(uint256 _minBid) {
        minBid = _minBid;
    }

    modifier onlyWMinBid() {
        if (msg.value < minBid) revert();
        _;
    }

    function bid() public payable onlyWMinBid returns (bool) {
        return true;
    }
}
