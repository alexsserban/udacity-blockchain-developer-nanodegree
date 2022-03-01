// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

/// @custom:security-contact alex.serban142@gmail.com
contract SampleToken is ERC20 {
    constructor() ERC20("SampleToken", "STK") {
        _mint(msg.sender, 100 * 10**decimals());
    }
}
