import React, { useState } from 'react';
import './App.css';
import RoleSelection from './RoleSelection.jsx';
import Login from './login.jsx';
import Signup from './Signup.jsx';

function App() {
  const [step, setStep] = useState('login');

  return (
    <div className="App">
      {step === 'login' && <Login setStep={setStep} />}
      {step === 'roleSelection' && <RoleSelection setStep={setStep} />}
      {step === 'signup' && <Signup setStep={setStep} />}
    </div>
  );
}

export default App;
