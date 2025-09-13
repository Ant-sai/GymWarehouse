import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StockPage from './StockPage';
import Membre from './Membre';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/stock" replace />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/membres" element={<Membre />} />
      </Routes>
    </Router>
  );
}

export default App;