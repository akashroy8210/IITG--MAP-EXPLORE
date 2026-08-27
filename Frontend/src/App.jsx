import { useState } from 'react'
import LandingPage from './pages/LandingPage'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import InstructionsPage from './pages/InstructionsPage';
import Puzzle1 from './pages/Puzzle-1';
import Puzzle2 from './pages/Puzzle-2';
import Puzzle3 from './pages/Puzzle-3';
import Puzzle4 from './pages/Puzzle-4';
import Puzzle5 from './pages/Puzzle-5';
import './App.css';
import Maingate from './pages/Maingate';
function App() {


  return (
    <BrowserRouter>
      <Routes>
        <Route path='/login' element={<LandingPage/>}></Route>
        <Route path='/Instructions' element={<InstructionsPage/>}></Route>
        <Route path='/puzzle-1' element={<Puzzle1 />}></Route>
        <Route path='/puzzle-2' element={<Puzzle2 />}></Route>
        <Route path='/puzzle-3' element={<Puzzle3 />}></Route>
        <Route path='/puzzle-4' element={<Puzzle4 />}></Route>
        <Route path='/puzzle-5' element={<Puzzle5 />}></Route>
        <Route path='/maingate' element={<Maingate/>}></Route>
      </Routes>
    </BrowserRouter>
  )
}


export default App
