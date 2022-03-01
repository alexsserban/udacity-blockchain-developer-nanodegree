// SPDX-License-Identifier: MIT
pragma solidity >=0.4.22 <0.9.0;

contract StringsContract {
  constructor() public {
  }

  function charAt(string memory text, uint8 index) public pure returns (bytes1) {
    require(index < bytes(text).length, "Index out of range");
    return bytes(text)[index];
  }
}
