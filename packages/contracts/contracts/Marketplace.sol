//SPDX-License-Identifier: Unlicense
pragma solidity =0.8.20;

import "./NFTContract.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FractionalToken is ERC20 {
    constructor(uint256 initialSupply) ERC20("FractionalNFT", "FNFT") {
        _mint(msg.sender, initialSupply);
    }
}

contract Marketplace {

    NFTContract public nftContract;

    uint256 private _tokenIds;

    uint256 private _itemsSold;

    address payable owner;

    uint256 listPrice = 0.0005 ether;

    constructor(address _nftContractAddress) {
        owner = payable(msg.sender);
        nftContract = NFTContract(_nftContractAddress);
    }


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

    

    function getBalanceSupplyOfTokens(address fractionalTokenAddress) public view returns (uint256) {
        FractionalToken fractionalToken = FractionalToken(fractionalTokenAddress);
        uint256 balanceSupply = fractionalToken.balanceOf(address(this));

        return balanceSupply;
    }

    function getAllFractions() public view returns (FractOwner[] memory) {
        return addressToFractions[msg.sender];
    }

    function addFractionOwnership(address owner, uint256 tokenId, uint256 _fractionAmount) private {
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

    function removeFractionOwnership(address owner, uint256 tokenId, uint256 _fractionAmount) private {
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

    function mintNewNFT(string memory tokenURI) external returns (uint256) {
        return nftContract.mintNFT(msg.sender, tokenURI);
    }

    function createListedToken(uint256 tokenId, string memory tokenURI, uint256 price, uint256 fractionSupply) public payable {
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

        _tokenIds++;

        fractionalizeToken(tokenId, fractionSupply);

        nftContract.transfer(msg.sender, address(this), tokenId);

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

    function fractionalizeToken(uint256 tokenId, uint256 fractionSupply) private {
        require(idToListedToken[tokenId].fractionalTokenAddress == address(0), "Already fractionalized");

        FractionalToken fractionalToken = new FractionalToken(fractionSupply);
        idToListedToken[tokenId].fractionalTokenAddress = address(fractionalToken);

        // Transfer all fractional tokens to the owner (smart contract in this case)
        fractionalToken.transfer(address(this), fractionSupply);

        approveFractionTransfer(address(fractionalToken), fractionSupply);
    }

    function approveFractionTransfer(address fractionalTokenAddress, uint256 amount) private {
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

            nftContract.transfer(address(this), msg.sender, tokenId);

            uint256 allowance = fractionalToken.allowance(listedToken.owner, address(this));
            require(allowance >= fractionAmount, "Contract not approved to transfer the required amount of tokens");

            fractionalToken.transferFrom(listedToken.owner, msg.sender, fractionAmount);

            listedToken.currentlyListed = false;
            listedToken.seller = payable(msg.sender);
            _itemsSold++;

            // approve(address(this), tokenId);
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

    function listTheNFT(uint256 tokenId) public payable {
        require(idToListedToken[tokenId].owner == msg.sender, "Only the owner can list the item");

        idToListedToken[tokenId].currentlyListed = true;
    }   
}