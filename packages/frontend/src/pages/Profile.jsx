import React from 'react'
import Navbar from '../components/Navbar'
import { useStateContext } from '../context/StateContext'
import NFTS from '../components/NFTS'
import { useAuthContext } from '../context/AuthContext'

const Profile = () => {
  const { nfts, fetchNFTs, fetchMyFractions, myFractions } = useStateContext()
  const { account } = useAuthContext()
  const [fractionalNFTs, setFractionalNFTs] = React.useState([])
  React.useEffect(() => {
    fetchNFTs()
    fetchMyFractions()
  }, [])

  React.useEffect(() => {
    if(nfts.length > 0 && myFractions.length > 0){
      const mergedNFTs = nfts.map(nft => {
        const fraction = myFractions.find(f => f.tokenId === nft.id);
        if(fraction){
          return {
              ...nft,
              fractionAmount: fraction ? fraction.fractionAmount : 0 // Default to 0 if no fraction found
          };
        }
      });
      console.log(mergedNFTs);
      setFractionalNFTs(mergedNFTs)
    }
  }, [myFractions, nfts])
  return (
    <>
      <Navbar />
      <div className='px-20'>
        <h3 className='text-2xl font-bold'>My NFT's</h3>
        {nfts && account && <NFTS fractional={false} nfts={nfts.filter(nft => nft.seller == account)} />}
        <h3 className='text-2xl font-bold mt-40'>My Fractional NFT's</h3>
        {fractionalNFTs && <NFTS fractional={true} nfts={fractionalNFTs} />}
      </div>
    </>
  )
}

export default Profile