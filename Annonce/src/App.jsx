import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Header from './components/Header';
import Footer from './components/Footer';
import Landing from './pages/Landing';
import JobDetails from './pages/JobDetails';
import Apply from './pages/Apply';

function App() {
  const [isAdmin, setIsAdmin] = useState(false);

  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-50 font-sans">
        <Header isAdmin={isAdmin} setIsAdmin={setIsAdmin} />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Landing isAdmin={isAdmin} />} />
            <Route path="/job/:id" element={<JobDetails isAdmin={isAdmin} />} />
            <Route path="/apply/:id" element={<Apply />} />
          </Routes>
        </div>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
