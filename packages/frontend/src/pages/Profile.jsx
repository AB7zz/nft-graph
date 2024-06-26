import React from 'react'
import Navbar from '../components/Navbar'
import { useStateContext } from '../context/StateContext'
import NFTS from '../components/NFTS'
import { useAuthContext } from '../context/AuthContext'

const Profile = () => {
  const { nfts, fetchNFTs } = useStateContext()
  const { account } = useAuthContext()
  React.useEffect(() => {
    if(nfts == null){
      fetchNFTs()
    }
  }, [nfts])
  return (
    <>
      <Navbar />
      {nfts && account && <NFTS nfts={nfts.filter(nft => nft.seller == account)} />}
    </>
  )
}

export default Profile