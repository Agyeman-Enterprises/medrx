import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom';
import Header from './components/Header';
import Hero from './components/Hero';
import Services from './components/Services';
import HowItWorks from './components/HowItWorks';
import Testimonials from './components/Testimonials';
import Booking from './components/Booking';
import BookingSuccess from './components/BookingSuccess';
import IntakeForm from './components/IntakeForm';
import ConsentForms from './components/ConsentForms';
import Footer from './components/Footer';
import { Toaster } from './components/ui/sonner';

// Wrapper components for route params
const IntakeFormWrapper = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient_id') || '';
  const appointmentId = searchParams.get('appointment_id') || '';
  
  return (
    <IntakeForm
      patientId={patientId}
      appointmentId={appointmentId}
      onComplete={() => window.location.href = '/'}
      onCancel={() => window.location.href = '/'}
    />
  );
};

const ConsentFormsWrapper = () => {
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patient_id') || '';
  const appointmentId = searchParams.get('appointment_id') || '';
  
  return (
    <ConsentForms
      patientId={patientId}
      appointmentId={appointmentId}
      onComplete={() => window.location.href = '/'}
      onCancel={() => window.location.href = '/'}
    />
  );
};

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
          <Route path="/intake" element={<IntakeFormWrapper />} />
          <Route path="/consents" element={<ConsentFormsWrapper />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;