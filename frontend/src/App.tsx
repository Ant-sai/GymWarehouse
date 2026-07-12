//app.tsx
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StockPage from './StockPage';
import Membre from './Membre';
import Commandes from './Commandes';
import AdminSecretEdit from './AdminSecretEdit';
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/stock" replace />} />
        <Route path="/stock" element={<StockPage />} />
        <Route path="/membres" element={<Membre />} />
        <Route path="/commandes" element={<Commandes />} /> {/* ← Ajouter cette route */}
        {/* Page d'administration restreinte : accessible uniquement via cette URL exacte, non référencée ailleurs */}
        <Route path="/admin-d2642d301eae38afea7e24cf" element={<AdminSecretEdit />} />
      </Routes>
    </Router>
  );
}

export default App;