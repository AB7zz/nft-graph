import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NFT from './pages/NFT'
import Mint from './pages/Mint'
import Profile from './pages/Profile'
import { useAuthContext } from './context/AuthContext'

function App() {

  const { connect } = useAuthContext()

  React.useEffect(() => {
    connect()
  }, [])

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nft/:id" element={<NFT />} />
          <Route path="/mint" element={<Mint />} />
          <Route path="/profile" element={<Profile />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
