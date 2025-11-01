import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Booking from './components/Booking';
import BookingSuccess from './components/BookingSuccess';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={
            <>
              <Header />
              <Hero />
              <Services />
              <HowItWorks />
              <Testimonials />
              <Booking />
              <Footer />
            </>
          } />
          <Route path="/booking-success" element={<BookingSuccess />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;