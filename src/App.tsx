import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Introduce from './pages/Introduce';
import Products from './pages/products/page';
import Portfolio from './pages/portfolio/page';
import Questions from './pages/questions/page';
import Support from './pages/support/page';
import ManagerRouter from './pages/manager/ManagerRouter';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Header />
        <main className="content">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/introduce" element={<Introduce />} />
            <Route path="/products" element={<Products />} />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/questions" element={<Questions />} />
            <Route path="/support" element={<Support />} />
            <Route path="/manager/*" element={<ManagerRouter />} />
            {/* <Route path="/store" element={<div>Store 페이지</div>} /> */}
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 