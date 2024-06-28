import React from 'react'
import { ethers } from 'ethers'
import { provider, useAuthContext } from './AuthContext'
import { MarketplaceAddress, NFTContractAddress } from '../constants'
import marketplace from '../abi/Marketplace.json'
import nftContract from '../abi/NFTContract.json'

const StateContext = React.createContext()

const signer = provider.getSigner()

const marketplaceContract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);
const NFTContract = new ethers.Contract(NFTContractAddress, nftContract.abi, signer);

export const StateProvider = ({ children }) => {

  const { account } = useAuthContext()

  const [nfts, setNFTs] = React.useState([]);

  const [nft, setNFT] = React.useState({})

  const insertToIPFS = async (data) => {
    const url = `https://api.pinata.cloud/pinning/pinFileToIPFS`;
    const formData = new FormData();
    const metadata = JSON.stringify({
      name: data.name,
      description: data.description,
      price: data.price,
    })
    const options = JSON.stringify({
      cidVersion: 0,
    });
    
    formData.append("file", data.file);
    formData.append("pinataMetadata", metadata);
    formData.append("pinataOptions", options);

    const res = await fetch(
        url,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_PINATA_JWT}`,
          },
          body: formData,
        }
    );
    const json = await res.json();
    console.log('CID: ', json.IpfsHash)
    return json.IpfsHash;
  }

  const createNFT = async(tokenURI, price, fractionSupply) => {
    const value = ethers.utils.parseEther("0.0005"); // 50 ETH in Wei
    const txOptions = { 
      value,
      gasLimit: ethers.utils.hexlify(3000000)
    };
  
    try {
      // const tokenId = await NFTContract.mintNFT(tokenURI);
      const tx = await marketplaceContract.createListedToken(1, tokenURI, price, fractionSupply, txOptions);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt.transactionHash);
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  }

  const fetchNFTs = async () => {
    if (marketplaceContract) {
      try {
        const fetchedNFTs = await marketplaceContract.getAllNFTs();
        const parsedNFTs = fetchedNFTs.map((nftData) => {
          if(nftData[5]){
            const readableNFT = {
              id: parseInt(nftData[0]._hex, 16),
              url: `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${nftData[1]}`,
              owner: nftData[2],
              seller: nftData[3],
              price: parseInt(nftData[4]._hex, 16) / (10**18),
              listed: nftData[5]
            };
  
            return readableNFT;
          }
        });
        console.log(parsedNFTs)
        setNFTs(parsedNFTs);
      } catch (error) {
        console.error("Error fetching NFTs:", error);
      }
    }
  };

  const buyNFT = async (tokenId, price) => {
    if (!account) return
    
    if (!marketplaceContract) return;

    const tx = await marketplaceContract.executeSale(tokenId, {
      value: ethers.utils.parseEther(price.toString())
    });

    console.log("Transaction hash:", tx.hash);

    try {
      await tx.wait();
      console.log("Transaction confirmed!");
      window.location.replace('/profile')
    } catch (error) {
      console.error("Error executing sale:", error);
      // Handle transaction error (e.g., display error message)
    }
  };

  const listTheNFT = async (tokenId) => {
    if (!account) return
    
    if (!marketplaceContract) return;

    const tx = await marketplaceContract.listTheNFT(tokenId);

    console.log("Transaction hash:", tx.hash);

    try {
      await tx.wait();
      console.log("Transaction confirmed!");
      window.location.replace('/profile')
    } catch (error) {
      console.error("Error executing sale:", error);
      // Handle transaction error (e.g., display error message)
    }
  };
    
  return (
    <StateContext.Provider value={{ 
      insertToIPFS,
      createNFT,
      fetchNFTs,
      buyNFT,
      listTheNFT,
      setNFT,
      nft,
      nfts
    }}>
    {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => React.useContext(StateContext)
