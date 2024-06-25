import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import NFT from './pages/NFT'
import Mint from './pages/Mint'

function App() {

  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/nft/:id" element={<NFT />} />
          <Route path="/mint" element={<Mint />} />
        </Routes>
      </BrowserRouter>
    </>
  )
}

export default App
