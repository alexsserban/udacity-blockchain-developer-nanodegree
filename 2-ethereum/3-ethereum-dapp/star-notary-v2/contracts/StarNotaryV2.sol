// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "../node_modules/openzeppelin-solidity/contracts/access/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/utils/Counters.sol";

/// @custom:security-contact alex.serban142gmail.com
contract StarNotaryV2 is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter public _tokenIdCounter;

    mapping(uint256 => string) public tokenIdToStarInfo;
    mapping(uint256 => uint256) public starsForSale;

    constructor() ERC721("StarNotaryV2", "SN2") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    // Create Star using the Struct
    function createStar(string memory _name) public returns (uint256) {
        uint256 starId = _tokenIdCounter.current();
        _tokenIdCounter.increment();

        tokenIdToStarInfo[starId] = _name; // Creating in memory the Star -> tokenId mapping
        _mint(address(msg.sender), starId); // _mint assign the the star with _tokenId to the sender address (ownership)
        approve(address(this), starId);

        return starId;
    }

    // Putting an Star for sale (Adding the star tokenid into the mapping starsForSale, first verify that the sender is the owner)
    function putStarUpForSale(uint256 _tokenId, uint256 _price) public {
        require(
            ownerOf(_tokenId) == msg.sender,
            "You can't sale the Star you don't owned"
        );
        starsForSale[_tokenId] = _price;
    }

    function buyStar(uint256 _tokenId) public payable {
        require(starsForSale[_tokenId] > 0, "The Star should be up for sale");
        uint256 starCost = starsForSale[_tokenId];
        address ownerAddress = ownerOf(_tokenId);
        require(msg.value > starCost, "You need to have enough Ether");
        this.transferFrom(ownerAddress, msg.sender, _tokenId);
        address payable ownerAddressPayable = payable(ownerAddress);
        ownerAddressPayable.transfer(starCost);
        if (msg.value > starCost) {
            payable(msg.sender).transfer(msg.value - starCost);
        }
    }
}
