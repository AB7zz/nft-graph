// SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTContract is ERC721URIStorage {
    uint256 private _tokenIds;

    constructor() ERC721("NFTContract", "NFTC") {}

    function mintNFT(string memory tokenURI) external returns (uint256) {
        _tokenIds++;    
        uint256 newTokenId = _tokenIds;
        _safeMint(msg.sender, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }
}