import React from 'react'
import { Link } from 'react-router-dom'
import { useStateContext } from '../context/StateContext'
import { useAuthContext } from '../context/AuthContext'

const NFTCard = ({ nft }) => {
  const { account } = useAuthContext()

  const { buyNFT, listTheNFT, setNFT } = useStateContext()

  return(
    <div key={nft.id} className='bg-gray-100 p-5 rounded-lg'>
      <Link to={`/nft/${nft.id}`} >
        <img onClick={() => setNFT(nft)} src={nft.url} alt={'NFT'} className='w-full rounded-lg' />
      </Link>
        {/* <h1 className='text-xl font-semibold mt-2'>{nft.name}</h1> */}
        <p className='text-gray-500'>Price: {nft.price} ETH</p>
        
        {nft.seller != account && <button
        onClick={() => buyNFT(nft.id, nft.price)} 
        className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>Buy</button>}

        {nft.seller == account && !nft.listed && <button
        onClick={() => listTheNFT(nft.id)} 
        className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>List it</button>}
    </div>
  )
}

const NFTS = ({ nfts }) => {
  
  return (
    <div className='container mx-auto p-5'>
        <div className='grid grid-cols-3 gap-4'>
          {nfts.length > 0 ? nfts.map((nft, i) => (
            <NFTCard nft={nft} />
          ))
          :
          <h2 className='text-black text-center font-bold text-2xl'>No NFT's</h2>
          }
        </div>
    </div>
  )
}

export default NFTS