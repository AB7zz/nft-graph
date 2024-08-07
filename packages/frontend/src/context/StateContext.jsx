import React from 'react'
import { ethers } from 'ethers'
import { provider, useAuthContext } from './AuthContext'
import { MarketplaceAddress } from '../constants'
import marketplace from '../abi/Marketplace.json'

const StateContext = React.createContext()

const signer = provider.getSigner()

const marketplaceContract = new ethers.Contract(MarketplaceAddress, marketplace.abi, signer);

export const StateProvider = ({ children }) => {

  const { account } = useAuthContext()

  const [nfts, setNFTs] = React.useState([]);

  const [nft, setNFT] = React.useState({})

  const [myFractions, setMyFractions] = React.useState([])

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
    const value = ethers.utils.parseEther("0.0005"); // 0.0005 ETH to Wei
    const gasEstimate = await marketplaceContract.estimateGas.createListedToken(tokenURI, price, fractionSupply, { value });

    const gasPrice = await provider.getGasPrice();
    const maxPriorityFeePerGas = ethers.utils.parseUnits('2', 'gwei'); // You can adjust this value based on current network conditions
    const maxFeePerGas = gasPrice.add(maxPriorityFeePerGas);
    const txOptions = { 
      value,
      gasLimit: gasEstimate,
      maxPriorityFeePerGas,
      maxFeePerGas
    };
  
    try {
      const tx = await marketplaceContract.createListedToken(tokenURI, price, fractionSupply, txOptions);
      const receipt = await tx.wait();
      console.log("Transaction mined:", receipt.transactionHash);
    } catch (error) {
      console.error("Error creating NFT:", error);
    }
  }

  const getFractionalBalance = async (fractionalAddress) => {
    const balance = await marketplaceContract.getBalanceSupplyOfTokens(fractionalAddress);
    console.log(parseInt(balance._hex, 16))
    return parseInt(balance._hex, 16);
  }

  const fetchMyFractions = async () => {
    if (marketplaceContract) {
      console.log('yes')
      try {
        const fetchedFractions = await marketplaceContract.getAllFractions();
        const parsedFractions = fetchedFractions.map((fractionData) => {
          const readableFraction = {
            tokenId: parseInt(fractionData.tokenId._hex, 16),
            fractionAmount: parseInt(fractionData.fractionAmount._hex, 16),
          }
          return readableFraction
        })
        console.log(parsedFractions)
        setMyFractions(parsedFractions)
      } catch (error) {
        console.error("Error fetching Fractions:", error);
      }
    }else{
      console.log('nope')
    }
  }

  const fetchNFTs = async () => {
    if (marketplaceContract) {
      try {
        console.log(marketplaceContract)
        const fetchedNFTs = await marketplaceContract.getAllNFTs();
        const parsedNFTs = fetchedNFTs.map((nftData) => {
          if(nftData[5]){
            const readableNFT = {
              id: parseInt(nftData[0]._hex, 16),
              url: `https://${import.meta.env.VITE_GATEWAY_URL}/ipfs/${nftData[1]}`,
              owner: nftData[2],
              seller: nftData[3],
              price: parseInt(nftData[4]._hex, 16) / (10**18),
              listed: nftData[5],
              fractionalAddress: nftData[6]
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

  const buyNFT = async (tokenId, price, fraction) => {
    if(fraction <= 0) return

    if (!account) return
    
    if (!marketplaceContract) return;

    if (price <= 0) return

    const value = ethers.utils.parseEther(price.toString());

    const gasEstimate = await marketplaceContract.estimateGas.buyFraction(tokenId, fraction, { value });

    const gasPrice = await provider.getGasPrice();
    const maxPriorityFeePerGas = ethers.utils.parseUnits('2', 'gwei'); // You can adjust this value based on current network conditions
    const maxFeePerGas = gasPrice.add(maxPriorityFeePerGas);

    const txOptions = { 
      value,
      gasLimit: gasEstimate,
      maxPriorityFeePerGas,
      maxFeePerGas
    };

    const tx = await marketplaceContract.buyFraction(tokenId, fraction, txOptions);

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
      getFractionalBalance,
      fetchMyFractions,
      myFractions,
      nft,
      nfts
    }}>
    {children}
    </StateContext.Provider>
  )
}

export const useStateContext = () => React.useContext(StateContext)
