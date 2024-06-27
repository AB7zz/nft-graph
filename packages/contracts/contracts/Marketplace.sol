//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.10;

import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FractionalToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("FractionalNFT", "FNFT") {
        _mint(msg.sender, initialSupply);
    }
}

contract Marketplace is ERC721 {

    //_tokenIds variable has the most recent minted tokenId
    uint256 private _tokenIds;
    //Keeps track of the number of items sold on the marketplace
    uint256 private _itemsSold;
    //owner is the contract address that created the smart contract
    address payable owner;
    //The fee charged by the marketplace to be allowed to list an NFT
    uint256 listPrice = 0.0005 ether;

    //The structure to store info about a listed token
    struct ListedToken {
        uint256 tokenId;
        string tokenURI;
        address payable owner;
        address payable seller;
        uint256 price;
        bool currentlyListed;
        address fractionalTokenAddress;
    }

    struct FractOwner {
        uint256 tokenId;
        uint256 fractionAmount;
    }

    mapping(address => FractOwner[]) private addressToFractions;

    //the event emitted when a token is successfully listed
    event TokenListedSuccess (
        uint256 indexed tokenId,
        string tokenURI,
        address owner,
        address seller,
        uint256 price,
        bool currentlyListed
    );

    //This mapping maps tokenId to token info and is helpful when retrieving details about a tokenId
    mapping(uint256 => ListedToken) private idToListedToken;

    constructor() ERC721("NFTMarketplace", "NFTM") {
        owner = payable(msg.sender);
    }

    function getBalanceSupplyOfTokens(address fractionalTokenAddress) public view returns (uint256) {
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        uint256 balanceSupply = fractionalToken.balanceOf(address(this));

        return balanceSupply;
    }

    function getAllFractions() public view returns (FractOwner[] memory) {
        return addressToFractions[msg.sender];
    }

    function addFractionOwnership(address owner, uint256 tokenId, uint256 _fractionAmount) internal {
        bool found = false;
        for (uint256 i = 0; i < addressToFractions[owner].length; i++) {
            if (addressToFractions[owner][i].tokenId == tokenId) {
                addressToFractions[owner][i].fractionAmount += _fractionAmount;
                found = true;
                break;
            }
        }
        if (!found) {
            addressToFractions[owner].push(FractOwner(tokenId, _fractionAmount));
        }
    }

    function removeFractionOwnership(address owner, uint256 tokenId, uint256 _fractionAmount) internal {
        for (uint256 i = 0; i < addressToFractions[owner].length; i++) {
            if (addressToFractions[owner][i].tokenId == tokenId) {
                if (addressToFractions[owner][i].fractionAmount >= _fractionAmount) {
                    addressToFractions[owner][i].fractionAmount -= _fractionAmount;
                    if (addressToFractions[owner][i].fractionAmount == 0) {
                        addressToFractions[owner][i] = addressToFractions[owner][addressToFractions[owner].length - 1];
                        addressToFractions[owner].pop();
                    }
                }
                break;
            }
        }
    }

    function createListedToken(uint256 tokenId, string memory tokenURI, uint256 price, uint256 fractionSupply) private {
        require(msg.value == listPrice, "Hopefully sending the correct price");

        //Just sanity check
        require(price > 0, "Make sure the price isn't negative");

        //Update the mapping of tokenId's to Token details, useful for retrieval functions
        idToListedToken[tokenId] = ListedToken(
            tokenId,
            tokenURI,
            payable(address(this)),
            payable(msg.sender),
            price,
            true,
            address(0)
        );

        fractionalizeToken(tokenId, fractionSupply);

        _transfer(msg.sender, address(this), tokenId);
        //Emit the event for successful transfer. The frontend parses this message and updates the end user
        emit TokenListedSuccess(
            tokenId,
            tokenURI,
            address(this),
            msg.sender,
            price,
            true
        );

        payable(owner).transfer(listPrice);
    }

    function fractionalizeToken(uint256 tokenId, uint256 fractionSupply) public {
        require(idToListedToken[tokenId].fractionalTokenAddress == address(0), "Already fractionalized");

        FractionalToken fractionalToken = new FractionalToken(fractionSupply);
        idToListedToken[tokenId].fractionalTokenAddress = address(fractionalToken);

        // Transfer all fractional tokens to the owner (smart contract in this case)
        fractionalToken.transfer(address(this), fractionSupply);

        approveFractionTransfer(address(fractionalToken), fractionSupply);
    }

    function approveFractionTransfer(address fractionalTokenAddress, uint256 amount) public {
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        fractionalToken.approve(address(this), amount);
    }


    function buyFraction(uint256 tokenId, uint256 fractionAmount) public payable {
        ListedToken storage listedToken = idToListedToken[tokenId];

        uint256 fractionPrice;
        FractionalToken fractionalToken = FractionalToken(listedToken.fractionalTokenAddress);
        uint256 totalSupply = fractionalToken.totalSupply();
        if (fractionAmount < totalSupply) {
            fractionPrice = listedToken.price / totalSupply;
            require(msg.value == fractionPrice * fractionAmount, "Incorrect ETH value sent");

            uint256 allowance = fractionalToken.allowance(listedToken.owner, address(this));
            require(allowance >= fractionAmount, "Contract not approved to transfer the required amount of tokens");

            fractionalToken.transferFrom(listedToken.owner, msg.sender, fractionAmount);

            addFractionOwnership(msg.sender, tokenId, fractionAmount);
        } else if(fractionAmount == totalSupply) {
            fractionPrice = listedToken.price / totalSupply;
            require(msg.value == fractionPrice * fractionAmount, "Incorrect ETH value sent");

            _transfer(address(this), msg.sender, tokenId);

            uint256 allowance = fractionalToken.allowance(listedToken.owner, address(this));
            require(allowance >= fractionAmount, "Contract not approved to transfer the required amount of tokens");

            fractionalToken.transferFrom(listedToken.owner, msg.sender, fractionAmount);

            listedToken.currentlyListed = false;
            listedToken.seller = payable(msg.sender);
            _itemsSold++;

            approve(address(this), tokenId);
            payable(listedToken.seller).transfer(msg.value);

            removeFractionOwnership(msg.sender, tokenId, fractionAmount);
        } else {
            revert("Requested fraction amount exceeds total supply");
        }
    }
    
    //This will return all the NFTs currently listed to be sold on the marketplace
    function getAllNFTs() public view returns (ListedToken[] memory) {
        uint nftCount = _tokenIds;
        ListedToken[] memory tokens = new ListedToken[](nftCount);
        uint currentIndex = 0;

        //at the moment currentlyListed is true for all, if it becomes false in the future we will 
        //filter out currentlyListed == false over here
        for(uint i=0;i<nftCount;i++)
        {
            uint currentId = i + 1;
            ListedToken storage currentItem = idToListedToken[currentId];
            tokens[currentIndex] = currentItem;
            currentIndex += 1;
        }
        //the array 'tokens' has the list of all NFTs in the marketplace
        return tokens;
    }
    
    //Returns all the NFTs that the current user is owner or seller in
    function getMyNFTs() public view returns (ListedToken[] memory) {
        uint totalItemCount = _tokenIds;
        uint itemCount = 0;
        uint currentIndex = 0;
        
        //Important to get a count of all the NFTs that belong to the user before we can make an array for them
        for(uint i=0; i < totalItemCount; i++)
        {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender){
                itemCount += 1;
            }
        }

        //Once you have the count of relevant NFTs, create an array then store all the NFTs in it
        ListedToken[] memory items = new ListedToken[](itemCount);
        for(uint i=0; i < totalItemCount; i++) {
            if(idToListedToken[i+1].owner == msg.sender || idToListedToken[i+1].seller == msg.sender) {
                uint currentId = i+1;
                ListedToken storage currentItem = idToListedToken[currentId];
                items[currentIndex] = currentItem;
                currentIndex += 1;
            }
        }
        return items;
    }

    function listTheNFT(uint256 tokenId) public payable {
        require(idToListedToken[tokenId].owner == msg.sender, "Only the owner can list the item");

        idToListedToken[tokenId].currentlyListed = true;
    }   
}