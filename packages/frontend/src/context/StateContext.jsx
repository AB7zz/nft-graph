import React from 'react'
import { ethers } from 'ethers'
import { provider } from './AuthContext'
import { MarketplaceAddress } from '../constants'
import marketplace from '../abi/Marketplace.json'

const StateContext = React.createContext()

export const StateProvider = ({ children }) => {

    const [nfts, setNfts] = React.useState([]);

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
          setNfts(parsedNFTs);
        } catch (error) {
          console.error("Error fetching NFTs:", error);
        }
      }
    };
    
    return (
        <StateContext.Provider value={{ 
            insertToIPFS,
            createNFT,
            fetchNFTs,
            nfts
        }}>
        {children}
        </StateContext.Provider>
    )
}

export const useStateContext = () => React.useContext(StateContext)
