import React from 'react'
import { Link } from 'react-router-dom'
import { useAuthContext } from '../context/AuthContext'

const Navbar = () => {
  const { account, connect, disconnect, balance } = useAuthContext()
  
  return (
    <div className='bg-gray-300 w-screen p-5'>
        <div className='flex justify-between'>
            <Link to='/' className='text-4xl font-semibold text-black'>NFT Marketplace</Link>
            {account ? 
              
              <div className='flex items-center'>
                <p className='cursor-pointer hover:bg-green-800 bg-green-700 text-white rounded px-5 py-2 mr-5 font-semibold'>{account.slice(0, 12)}...</p>
                <p className='cursor-pointer hover:bg-zinc-700 bg-black text-white rounded px-5 py-2 font-semibold mr-5'>{balance && balance.slice(0, 5)} ETH</p>
                <Link to='/mint' className='hover:bg-blue-800 bg-blue-500 mr-5 text-white px-4 py-2 rounded'>Mint</Link>
                <Link to='/profile' className='hover:bg-blue-800 bg-blue-500 mr-5 text-white px-4 py-2 rounded'>Profile</Link>
              </div>
            :
              <button onClick={connect} className='bg-blue-500 text-white px-4 py-2 rounded'>Connect Wallet</button>
            }
            
        </div>
    </div>
  )
}

export default Navbar