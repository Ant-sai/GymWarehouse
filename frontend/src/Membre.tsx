import React, { useState, useEffect } from "react";
import { Link, useLocation } from 'react-router-dom';

export type User = {
  id: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  role: "USER" | "TRAINER";
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export default function MembersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
    role: "USER" as "USER" | "TRAINER",
    balance: "",
  });

  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState("");

  // Fonction pour récupérer tous les utilisateurs
  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("http://localhost:3000/api/users");
      
      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Utilisateurs récupérés:', data);
      setUsers(data);
      
    } catch (err) {
      console.error('Erreur lors de la récupération des utilisateurs:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de récupérer les utilisateurs";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  // Charger les utilisateurs au montage du composant
  useEffect(() => {
    fetchUsers();
  }, []);

  async function handleAddUser(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);
    
    try {
      // Validation côté client
      if (!form.email?.trim()) {
        throw new Error("L'email est obligatoire");
      }
      if (!form.email.includes("@")) {
        throw new Error("L'email doit être valide");
      }

      console.log('Envoi des données:', {
        email: form.email,
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        phoneNumber: form.phoneNumber || null,
        role: form.role,
        balance: Number(form.balance || 0),
      });

      const response = await fetch("http://localhost:3000/api/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: form.email,
          firstName: form.firstName || null,
          lastName: form.lastName || null,
          phoneNumber: form.phoneNumber || null,
          role: form.role,
          balance: Number(form.balance || 0),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const newUser = await response.json();
      console.log('Utilisateur créé:', newUser);

      // Mettre à jour le state local
      setUsers((prev) => [newUser, ...prev]);
      
      // Réinitialiser le formulaire
      setShowForm(false);
      setForm({ 
        email: "",
        firstName: "",
        lastName: "",
        phoneNumber: "",
        role: "USER",
        balance: "",
      });

      alert("Membre ajouté avec succès !");
      
    } catch (err) {
      console.error('Erreur lors de l\'ajout du membre:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible d'ajouter le membre.";
      alert(errorMessage);
    } finally {
      setSaving(false);
    }
  }

  async function handleUpdateBalance(id: number) {
    if (!editBalance.trim()) {
      alert("Le nouveau solde est obligatoire");
      return;
    }

    const newBalance = Number(editBalance);
    if (isNaN(newBalance)) {
      alert("Le solde doit être un nombre valide");
      return;
    }

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingUser,
          balance: newBalance,
        }),
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      const updatedUser = await response.json();
      
      // Mettre à jour le state local
      setUsers((prev) => prev.map(user => 
        user.id === id ? updatedUser : user
      ));

      // Fermer le modal d'édition
      setEditingUser(null);
      setEditBalance("");
      
      alert("Solde mis à jour avec succès !");

    } catch (err) {
      console.error('Erreur lors de la mise à jour du solde:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de mettre à jour le solde";
      alert(errorMessage);
    }
  }

  function startEditBalance(user: User) {
    setEditingUser(user);
    setEditBalance(user.balance.toString());
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce membre ?")) return;

    try {
      const response = await fetch(`http://localhost:3000/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour le state local
      setUsers((prev) => prev.filter((u) => u.id !== id));
      alert("Membre supprimé avec succès !");

    } catch (err) {
      console.error('Erreur lors de la suppression:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de supprimer le membre";
      alert(errorMessage);
    }
  }

  // Fonction pour actualiser les données
  const handleRefresh = () => {
    fetchUsers();
  };

  // Fonction pour formater le nom complet
  const getFullName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Non renseigné";
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E2A47] text-white p-8">
        <h2 className="text-xl font-semibold mb-8">Gym Warehouse</h2>
        <nav className="space-y-4 text-sm">
          <Link 
            to="/stock"
            className="block text-[#AAB4C3] hover:text-white transition-colors"
          >
            Stock
          </Link>
          
          <Link 
            to="/membres"
            className="block font-medium text-white"
          >
            Membres
          </Link>
          
          <div className="text-[#AAB4C3]">
            Commandes
          </div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-12">
        <header className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-semibold text-black">Membres</h1>
            <button
              onClick={handleRefresh}
              className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-300"
              disabled={loading}
            >
              {loading ? "⟳" : "↻"} Actualiser
            </button>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
          >
            Ajouter un membre
          </button>
        </header>

        {/* États de chargement et d'erreur */}
        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-600">Chargement des membres...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700 font-medium">Erreur</div>
            <div className="text-red-600 text-sm">{error}</div>
            <button
              onClick={handleRefresh}
              className="mt-2 bg-red-100 text-red-700 px-3 py-1 rounded text-sm hover:bg-red-200"
            >
              Réessayer
            </button>
          </div>
        )}

        {/* Table header */}
        {!loading && !error && (
          <>
            <div className="grid grid-cols-6 gap-6 px-4 text-sm font-medium text-gray-700 mb-4">
              <div>Nom complet</div>
              <div>Email</div>
              <div>Téléphone</div>
              <div>Rôle</div>
              <div>Solde</div>
              <div>Actions</div>
            </div>

            {/* Content */}
            <div className="space-y-4 px-4">
              {users.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun membre dans la base de données</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Ajoutez votre premier membre en cliquant sur "Ajouter un membre"
                  </div>
                </div>
              )}
              
              {users.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg p-4 shadow-sm grid grid-cols-6 items-center text-black hover:shadow-md transition-shadow"
                >
                  <div className="truncate font-medium">{getFullName(user)}</div>
                  <div className="truncate text-sm">{user.email}</div>
                  <div className="truncate text-sm">{user.phoneNumber || "-"}</div>
                  <div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      user.role === "TRAINER" 
                        ? "bg-blue-100 text-blue-800" 
                        : "bg-gray-100 text-gray-800"
                    }`}>
                      {user.role === "TRAINER" ? "Entraîneur" : "Utilisateur"}
                    </span>
                  </div>
                  <div className={`font-medium ${
                    Number(user.balance) < 0 ? "text-red-600" : "text-green-600"
                  }`}>
                    {Number(user.balance).toFixed(2)} €
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => startEditBalance(user)}
                      className="p-1 hover:bg-blue-50 rounded"
                      title="Modifier le solde"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="m18.5 2.5 a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(user.id)} 
                      className="p-1 hover:bg-red-50 rounded"
                      title="Supprimer ce membre"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                        <path d="M3 6h18" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                        <path
                          d="M8 6v12a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V6"
                          stroke="#E74C3C"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path d="M10 11v6" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                        <path d="M14 11v6" stroke="#E74C3C" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Modal d'édition du solde */}
        {editingUser && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setEditingUser(null)} />
            <div className="relative bg-white rounded-lg p-6 w-[400px] shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-4 text-black">Modifier le solde</h3>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  Membre : <span className="font-medium">{getFullName(editingUser)}</span>
                </p>
                <p className="text-sm text-gray-600 mb-4">
                  Solde actuel : <span className="font-medium">{Number(editingUser.balance).toFixed(2)} €</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau solde</label>
                <input
                  type="number"
                  step="0.01"
                  value={editBalance}
                  onChange={(e) => setEditBalance(e.target.value)}
                  className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  placeholder="0.00"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateBalance(editingUser.id)}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Mettre à jour
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <form
              onSubmit={handleAddUser}
              className="relative bg-white rounded-lg p-6 w-[720px] shadow-lg z-50"
            >
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter un membre</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                    placeholder="email@exemple.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Rôle *</label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value as "USER" | "TRAINER" })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="TRAINER">Entraîneur</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Prénom</label>
                  <input
                    value={form.firstName}
                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Prénom (optionnel)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                  <input
                    value={form.lastName}
                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Nom (optionnel)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                  <input
                    type="tel"
                    value={form.phoneNumber}
                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="Téléphone (optionnel)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Solde initial</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.balance}
                    onChange={(e) => setForm({ ...form, balance: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                  disabled={saving}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? "Enregistrement..." : "Ajouter"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}