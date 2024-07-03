import React from 'react'
import Navbar from '../components/Navbar'
import NFTS from '../components/NFTS'
import { useStateContext } from '../context/StateContext'

const Home = () => {
  const { fetchNFTs, nfts, buyNFT } = useStateContext()
  React.useEffect(() => {
    fetchNFTs()
  }, [])
  return (
    <>
      <Navbar />
      <NFTS fractional={false} nfts={nfts} />
    </>
  )
}

export default Home