import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname]);

  return null;
}

function App() {
  return (
    <Router basename="/the-sound">
      <ScrollToTop />
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App; 