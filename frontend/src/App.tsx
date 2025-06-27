import React from 'react';
import AppRouter from './components/AppRouter';
import GlobalLoadingOverlay from './components/GlobalLoadingOverlay';
import './App.css';

function App() {
  return (
    <div className="App">
      <AppRouter />
      <GlobalLoadingOverlay />
    </div>
  );
}

export default App;
