import React from 'react'
import { ethers } from 'ethers'
import { provider, useAuthContext } from './AuthContext'
import { MarketplaceAddress } from '../constants'
import marketplace from '../abi/Marketplace.json'

const StateContext = React.createContext()

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

  const createNFT = async(tokenURI, price) => {
    const signer = provider.getSigner();
    const contract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);
  
    
    const value = ethers.utils.parseEther("0.0005"); // 50 ETH in Wei
    const txOptions = { value };
  
    try {
    const tx = await contract.createToken(tokenURI, price, txOptions);
      console.log("Transaction hash:", tx.hash);
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt.transactionHash);
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  }

  const fetchNFTs = async () => {
    const signer = provider.getSigner();
    const contract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);

    if (contract) {
      try {
        const fetchedNFTs = await contract.getAllNFTs();
        const parsedNFTs = fetchedNFTs.map((nftData) => {
          const readableNFT = {
            id: parseInt(nftData[0]._hex, 16),
            url: `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${nftData[1]}`,
            owner: nftData[2],
            seller: nftData[3],
            price: parseInt(nftData[4]._hex, 16) / (10**18),
            listed: nftData[5]
          };

          return readableNFT;
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
    const signer = provider.getSigner();
    const contract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);
  
    if (!contract) return;

    const tx = await contract.executeSale(tokenId, {
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
    const signer = provider.getSigner();
    const contract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);
  
    if (!contract) return;

    const tx = await contract.listTheNFT(tokenId);

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
