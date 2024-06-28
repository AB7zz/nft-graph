import React from 'react'
import { useStateContext } from '../../context/StateContext'
import { useAuthContext } from '../../context/AuthContext'
import Sankey from './Sankey'

const graphData = {
  "nodes": [
      { id: "bob" },
      { id: "alice" },
      { id: "carol" },
      { id: "mel" },
      { id: "yan" },
      { id: "bruh" },
      { id: "lol" }
  ],
  "links": [
      { source: "bob", target: "alice", value: 8 },
      { source: "alice", target: "carol", value: 4 },
      { source: "alice", target: "mel", value: 4 },
      { source: "mel", target: "yan", value: 4 },
      { source: "yan", target: "bruh", value: 2 },
      { source: "yan", target: "lol", value: 2 }
  ]
}

const Details = () => {
  const { nft } = useStateContext()
  const { account } = useAuthContext()

  const [graph, setGraph] = React.useState(false)

  return (
    <div className='container mx-auto p-5'>
      <div className='grid grid-cols-3 gap-4'>
        <div className='bg-gray-100 p-5 rounded-lg'>
          <img src={nft.url || 'https://amaranth-major-quail-530.mypinata.cloud/ipfs/Qme2YdwvEpSB4M4mmZ7dR1ZaLJk2ZQYVhLN4fCdRjSNCq8'} alt="NFT 1" className='w-full rounded-lg' />
          <h1 className='text-xl font-semibold mt-2'>NFT 1</h1>
          <p className='text-gray-500'>Price: {nft.price} ETH</p>
          {nft.seller != account && 
            <div className='flex'>
              <button
                onClick={() => buyNFT(nft.id, nft.price)} 
                className='mr-5 hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>
                  Buy
              </button>
              <button
                onClick={() => setGraph(graph => !graph)} 
                className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-2 rounded'>
                  {graph ? 'Close' : 'Generate Owner History Graph'}
              </button>
            </div>
          }
        </div>
        <div className='col-span-2'>
          {graph && <Sankey data={graphData} width={400} height={400} />}
        </div>
      </div>
    </div>
  )
}

export default Details