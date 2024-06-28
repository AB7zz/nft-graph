// SPDX-License-Identifier: Unlicense
pragma solidity =0.8.20;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

contract NFTContract is ERC721URIStorage {
    uint256 public _tokenIds;

    constructor() ERC721("NFTContract", "NFTC") {}

    function mintNFT(address to, string memory tokenURI) external returns (uint256) {
        _tokenIds++;    
        uint256 newTokenId = _tokenIds;
        _safeMint(to, newTokenId);
        _setTokenURI(newTokenId, tokenURI);
        return newTokenId;
    }

    function transfer(address from, address to, uint256 tokenId) external {
        _transfer(from, to, tokenId);
    }
}