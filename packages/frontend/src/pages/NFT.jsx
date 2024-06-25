import React from 'react'
import Navbar from '../components/Home/Navbar'
import { Link } from 'react-router-dom'
import Details from '../components/NFT/Details'

const NFT = () => {
    React.useEffect(() => {
        // get id from url
    }, [])
  return (
    <>
        <Navbar />
        <Link to='/' className='pl-5'>
            <button className='hover:bg-blue-800 bg-blue-500 text-white px-4 py-2 mt-5 rounded'>Back</button>
        </Link>
        <Details />
    </>
  )
}

export default NFT