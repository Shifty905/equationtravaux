import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Projects from './pages/Projects';
import Quotes from './pages/Quotes';
import Dashboard from './pages/Dashboard';
import Team from './pages/Team';
import Companies from './pages/Companies';
import Commissions from './pages/Commissions';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/home" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/quotes" element={<Quotes />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/team" element={<Team />} />
            <Route path="/companies" element={<Companies />} />
            <Route path="/commissions" element={<Commissions />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;