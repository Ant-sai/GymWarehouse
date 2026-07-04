import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import PrimeroseVector from './assets/PrimeroseVector.svg';
import { ForfaitModal } from "./components/Modals/ForfaitModal";
import { AbonnementModal } from "./components/Modals/AbonnementModal";


export type User = {
  id: number;
  firstName?: string;
  lastName?: string;
  subscriptionEndDate?: string | null;
  sessionCount?: number | null;
  dateOfBirth?: string | null;
  postalCode?: string | null;
  notes?: string | null;
  role: "USER" | "TRAINER";
  balance: number;
  createdAt: string;
  updatedAt: string;
};

export default function MembersPage() {
  const [searchParams] = useSearchParams();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState(() => searchParams.get("search") ?? "");
  const [showForfait, setShowForfait] = useState(false);
  const [showAbonnement, setShowAbonnement] = useState(false);
  const [modalUser, setModalUser] = useState<User | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    role: "USER" as "USER" | "TRAINER",
    balance: "",
    dateOfBirth: "",
    postalCode: "",
    notes: "",
  });

  const [saving, setSaving] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editBalance, setEditBalance] = useState("");
  const [editFirstName, setEditFirstName] = useState("");
  const [editLastName, setEditLastName] = useState("");
  const [editDateOfBirth, setEditDateOfBirth] = useState("");
  const [editPostalCode, setEditPostalCode] = useState("");
  const [editNotes, setEditNotes] = useState("");

  // Fonction pour formater le nom complet
  const getFullName = (user: User) => {
    const parts = [user.firstName, user.lastName].filter(Boolean);
    return parts.length > 0 ? parts.join(" ") : "Non renseigné";
  };

  // Fonction pour filtrer les utilisateurs selon le terme de recherche
  const filteredUsers = users.filter(user => {
    const fullName = getFullName(user).toLowerCase();
    const role = user.role === "TRAINER" ? "entraîneur" : "utilisateur";
    const search = searchTerm.toLowerCase();

    return fullName.includes(search) || 
           role.includes(search);
  });

  // Fonction pour récupérer tous les utilisateurs
  async function fetchUsers() {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch("/api/users");
      
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
    if (!form.firstName?.trim() && !form.lastName?.trim()) {
      throw new Error("Au moins le prénom ou le nom est obligatoire");
    }
    
    console.log('Envoi des données:', {
      firstName: form.firstName || null,
      lastName: form.lastName || null,
      role: form.role,
      balance: Number(form.balance || 0),
    });
    
    const response = await fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        firstName: form.firstName || null,
        lastName: form.lastName || null,
        role: form.role,
        balance: Number(form.balance || 0),
        dateOfBirth: form.dateOfBirth || null,
        postalCode: form.postalCode || null,
        notes: form.notes || null,
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
      firstName: "",
      lastName: "",
      role: "USER",
      balance: "",
      dateOfBirth: "",
      postalCode: "",
      notes: "",
    });
   
  } catch (err) {
    console.error('Erreur lors de l\'ajout du membre:', err);
    const errorMessage = err instanceof Error ? err.message : "Impossible d'ajouter le membre.";
    alert(errorMessage);
  } finally {
    setSaving(false);
  }
}

  async function handleUpdateUser(id: number) {
    if (!editFirstName.trim() && !editLastName.trim()) {
      alert("Au moins le prénom ou le nom est obligatoire");
      return;
    }

    const newBalance = Number(editBalance);
    if (isNaN(newBalance)) {
      alert("Le solde doit être un nombre valide");
      return;
    }

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: editFirstName || null,
          lastName: editLastName || null,
          role: editingUser?.role,
          balance: newBalance,
          dateOfBirth: editDateOfBirth || null,
          postalCode: editPostalCode || null,
          notes: editNotes || null,
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
      setEditFirstName("");
      setEditLastName("");
      setEditBalance("");
      setEditDateOfBirth("");
      setEditPostalCode("");
      setEditNotes("");

    } catch (err) {
      console.error('Erreur lors de la mise à jour du membre:', err);
      const errorMessage = err instanceof Error ? err.message : "Impossible de mettre à jour le membre";
      alert(errorMessage);
    }
  }

  function startEditUser(user: User) {
    setEditingUser(user);
    setEditFirstName(user.firstName || "");
    setEditLastName(user.lastName || "");
    setEditBalance(user.balance.toString());
    setEditDateOfBirth(user.dateOfBirth ? user.dateOfBirth.split("T")[0] : "");
    setEditPostalCode(user.postalCode || "");
    setEditNotes(user.notes || "");
  }

  async function handleDelete(id: number) {
    if (!confirm("Supprimer ce membre ?")) return;

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Erreur HTTP: ${response.status}`);
      }

      // Mettre à jour le state local
      setUsers((prev) => prev.filter((u) => u.id !== id));

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


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main */}
      <main className="p-8">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold text-[#1E2A47]">Membres</h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowForm(true)}
              className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm hover:bg-[#E8D5C4]"
            >
              Ajouter un membre
            </button>
            <img
              src={PrimeroseVector}
              alt="Gym Warehouse"
              className="h-10 w-auto"
            />
          </div>
        </header>

        {/* Barre de recherche */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Rechercher un membre (nom, rôle)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <svg 
              className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Compteur de résultats */}
          {searchTerm && !loading && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredUsers.length} résultat{filteredUsers.length > 1 ? 's' : ''} trouvé{filteredUsers.length > 1 ? 's' : ''} sur {users.length} membre{users.length > 1 ? 's' : ''}
            </div>
          )}
        </div>

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
            <div className="grid grid-cols-9 gap-6 px-4 text-sm font-medium text-gray-700 mb-4">
              <div>Nom complet</div>
              <div>Rôle</div>
              <div>Solde</div>
              <div>Date d'abonnement</div>
              <div>Nb entrées</div>
              <div className="col-span-2">Commentaire</div>
              <div className="col-span-2">Actions</div>
            </div>

            {/* Content */}
            <div className="space-y-4 px-4">
              {filteredUsers.length === 0 && users.length === 0 && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun membre dans la base de données</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Ajoutez votre premier membre en cliquant sur "Ajouter un membre"
                  </div>
                </div>
              )}

              {filteredUsers.length === 0 && users.length > 0 && searchTerm && (
                <div className="text-center py-8">
                  <div className="text-gray-500">Aucun membre trouvé pour "{searchTerm}"</div>
                  <div className="text-sm text-gray-400 mt-2">
                    Essayez de modifier votre recherche ou 
                    <button 
                      onClick={() => setSearchTerm("")}
                      className="text-blue-500 hover:text-blue-700 ml-1"
                    >
                      afficher tous les membres
                    </button>
                  </div>
                </div>
              )}
              
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="bg-white rounded-lg p-4 shadow-sm grid grid-cols-9 items-center text-black hover:shadow-md transition-shadow"
                >
                  <div className="truncate font-medium">{getFullName(user)}</div>
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
                  <div className="text-sm">
                              {user.subscriptionEndDate ? (
                                <span className={`px-2 py-1 rounded text-xs font-medium ${
                                  new Date(user.subscriptionEndDate) < new Date()
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}>
                                  {new Date(user.subscriptionEndDate).toLocaleDateString('fr-FR')}
                                </span>
                              ) : (
                                <span className="text-gray-400 text-xs">—</span>
                              )}
                            </div>
                  <div className="text-sm">
                    {user.sessionCount !== null && user.sessionCount !== undefined ? (
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        user.sessionCount <= 0 ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"
                      }`}>
                        {user.sessionCount}
                      </span>
                    ) : (
                      <span className="text-gray-400 text-xs">—</span>
                    )}
                  </div>
                  <div className="col-span-2 text-sm text-gray-600 truncate" title={user.notes || ""}>
                    {user.notes || <span className="text-gray-400 text-xs">—</span>}
                  </div>
                  <div className="col-span-2 flex items-center gap-1 flex-wrap">
                    <button
                      onClick={() => { setModalUser(user); setShowForfait(true); }}
                      className="px-2 py-1 text-xs rounded bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium"
                      title="Ajouter un forfait séances"
                    >
                      Séance
                    </button>
                    <button
                      onClick={() => { setModalUser(user); setShowAbonnement(true); }}
                      className="px-2 py-1 text-xs rounded bg-green-50 text-green-700 hover:bg-green-100 font-medium"
                      title="Renouveler l'abonnement"
                    >
                      Abonn.
                    </button>
                    <button
                      onClick={() => startEditUser(user)}
                      className="p-1 hover:bg-blue-50 rounded"
                      title="Modifier le membre"
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

        {/* Modal d'édition du membre */}
        {editingUser && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setEditingUser(null)} />
            <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">
              <h3 className="text-xl font-semibold mb-4 text-black">Modifier le membre</h3>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Prénom</label>
                    <input
                      type="text"
                      value={editFirstName}
                      onChange={(e) => setEditFirstName(e.target.value)}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Prénom"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                    <input
                      type="text"
                      value={editLastName}
                      onChange={(e) => setEditLastName(e.target.value)}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="Nom"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date de naissance</label>
                    <input
                      type="date"
                      value={editDateOfBirth}
                      onChange={(e) => setEditDateOfBirth(e.target.value)}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Code postal</label>
                    <input
                      type="text"
                      value={editPostalCode}
                      onChange={(e) => setEditPostalCode(e.target.value)}
                      className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="75001"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Commentaire</label>
                  <textarea
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="Commentaire (optionnel)"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleUpdateUser(editingUser.id)}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date de naissance</label>
                  <input
                    type="date"
                    value={form.dateOfBirth}
                    onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Code postal</label>
                  <input
                    type="text"
                    value={form.postalCode}
                    onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    placeholder="75001"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Commentaire</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
                    placeholder="Commentaire (optionnel)"
                    rows={3}
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
      {showForfait && (
        <ForfaitModal
          users={users}
          initialUser={modalUser}
          onClose={() => { setShowForfait(false); setModalUser(null); }}
          onSuccess={fetchUsers}
        />
      )}
      {showAbonnement && (
        <AbonnementModal
          users={users}
          initialUser={modalUser}
          onClose={() => { setShowAbonnement(false); setModalUser(null); }}
          onSuccess={fetchUsers}
        />
      )}
    </main>
    </div>
  );
}