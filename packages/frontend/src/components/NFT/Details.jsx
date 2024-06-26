import React from 'react'
import { useStateContext } from '../../context/StateContext'
import { useAuthContext } from '../../context/AuthContext'

const Details = () => {
  const { nft } = useStateContext()
  const { account } = useAuthContext()
  return (
    <div className='container mx-auto p-5'>
        <div className='grid grid-cols-3 gap-4'>
            <div className='bg-gray-100 p-5 rounded-lg'>
                <img src={nft.url} alt="NFT 1" className='w-full rounded-lg' />
                <h1 className='text-xl font-semibold mt-2'>NFT 1</h1>
                <p className='text-gray-500'>Price: {nft.price} ETH</p>
                {nft.seller != account && <button
                onClick={() => buyNFT(nft.id, nft.price)} 
                className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>Buy</button>}
            </div>
        </div>
    </div>
  )
}

export default Details