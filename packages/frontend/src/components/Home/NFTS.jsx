import React from 'react'
import { Link } from 'react-router-dom'
import { useStateContext } from '../../context/StateContext'
import { useAuthContext } from '../../context/AuthContext'

// const nfts = [
//     {
//       id: 1,
//       url: "https://i.redd.it/5xy48p0no5j71.png",
//       name: "NFT 1",
//       price: 0.087
//     },
//     {
//       id: 2,
//       url: "https://i.redd.it/5xy48p0no5j71.png",
//       name: "NFT 1",
//       price: 0.087
//     },
//     {
//       id: 3,
//       url: "https://i.redd.it/5xy48p0no5j71.png",
//       name: "NFT 1",
//       price: 0.087
//     }
// ]

const NFTS = () => {
  const { fetchNFTs, nfts, buyNFT } = useStateContext()
  const { account } = useAuthContext()
  React.useEffect(() => {
    fetchNFTs()
  }, [])
  return (
    <div className='container mx-auto p-5'>
        <div className='grid grid-cols-3 gap-4'>
            {nfts && nfts.map((nft, i) => (
            <div key={nft.id} className='bg-gray-100 p-5 rounded-lg'>
              <Link to={`/nft/${nft.id}`} >
                <img src={nft.url} alt={'NFT'} className='w-full rounded-lg' />
              </Link>
                {/* <h1 className='text-xl font-semibold mt-2'>{nft.name}</h1> */}
                <p className='text-gray-500'>Price: {nft.price} ETH</p>
                {nft.seller != account && <button
                onClick={() => buyNFT(nft.id, nft.price * (10 ** 18))} 
                className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>Buy</button>}
            </div>
            ))}
        </div>
    </div>
  )
}

export default NFTS