import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import About from './components/About';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Booking from './components/Booking';
import BookingSuccess from './components/BookingSuccess';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';

const HomePage = () => (
  <>
    <Header />
    <Hero />
    <About />
    <Services />
    <HowItWorks />
    <Booking />
    <Footer />
  </>
);

function App() {
  return (
    <div className="App">
      <Toaster position="top-right" />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/booking-success" element={<BookingSuccess />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;