// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "../node_modules/openzeppelin-solidity/contracts/token/ERC721/ERC721.sol";
import "../node_modules/openzeppelin-solidity/contracts/access/Ownable.sol";
import "../node_modules/openzeppelin-solidity/contracts/utils/Counters.sol";

/// @custom:security-contact alex.serban142gmail.com
contract StarNotary is ERC721, Ownable {
    using Counters for Counters.Counter;

    Counters.Counter private _tokenIdCounter;

    struct Star {
        string name;
    }

    // Mapping TokenId -> Star
    mapping(uint256 => Star) public tokenIdToStarInfo;

    // Mapping TokenId -> Price
    mapping(uint256 => uint256) public starsForSale;

    constructor() ERC721("StarNotary", "SNA") {}

    function safeMint(address to) public onlyOwner {
        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    function createStar(string memory _name) public {
        uint256 tokenId = _tokenIdCounter.current(); // Get current counter for tokens
        _tokenIdCounter.increment(); // Increment counter

        tokenIdToStarInfo[tokenId] = Star(_name); // Add the new Star to the mapping
        _mint(address(msg.sender), tokenId); // Assign ownership of the Star with tokenId
        approve(address(this), tokenId); // Aprove this contract's address to move ownership of the star
    }

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

        // Only the owner of the star & contract are able to transfer ownership
        this.transferFrom(ownerAddress, msg.sender, _tokenId);

        // Transfer ETH to the original owner
        address payable ownerAddressPayable = payable(ownerAddress);
        ownerAddressPayable.transfer(starCost);

        // Transfer remaining ETH to the buyer, if more than needed was sended
        if (msg.value > starCost) {
            payable(msg.sender).transfer(msg.value - starCost);
        }
    }

    function exchangeStars(uint256 _tokenId1, uint256 _tokenId2) public {
        address owner1 = ownerOf(_tokenId1);
        require(msg.sender == owner1, "First token is not owned by sender");

        address owner2 = ownerOf(_tokenId2);
        this.transferFrom(owner1, owner2, _tokenId1);
        this.transferFrom(owner2, owner1, _tokenId2);
    }

    function transferStar(address _to, uint256 _tokenId) public {
        address owner = ownerOf(_tokenId);
        require(msg.sender == owner, "Token is not owned by sender");

        this.transferFrom(owner, _to, _tokenId);
    }
}
