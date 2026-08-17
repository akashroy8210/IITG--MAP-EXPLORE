import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstructionsPage from './pages/InstructionsPage';
function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<LandingPage/>}></Route>
        <Route path='/Instructions' element={<InstructionsPage/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}


export default App
