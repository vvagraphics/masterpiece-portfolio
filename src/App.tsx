import { useState } from 'react';
import './App.css';

function App() {
  const [boot, setBoot] = useState(false);
  // Encoded: "Live Love Laugh"
  const payload = "TGl2ZSBMb3ZlIExhdWdo"; 

  return (
    <div className="bios-screen">
      <header className="header">
        <span>CORE_LOG: MASTERPIECE_INIT</span>
        <span>BUILD: ver.1337</span>
      </header>
      
      <main className="terminal">
        <p className="cursor">{'>'} SYSTEM_STATUS: {boot ? 'ROOT_ACCESS_GRANTED' : 'AWAITING_KERNEL_INIT'}</p>
        <p className="sub-text">{boot ? '' : 'ERR: MISSING_ENVIRONMENT_VARIABLES'}</p>
        
        <button className="auth-btn" onClick={() => setBoot(true)}>
          {boot ? payload : "INITIALIZE_CORE_VARS"}
        </button>
      </main>

      <footer className="footer">
        <code>0x2A // HUMAN_COMPILER_VARS_LOADED</code>
      </footer>
    </div>
  );
}

export default App;