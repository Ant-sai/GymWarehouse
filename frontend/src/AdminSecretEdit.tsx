import { useState, useEffect } from "react";
import type { User } from "./types/commandes.types";

type Payment = {
  id: number;
  memberId: number;
  type: "FORFAIT" | "ENTREE";
  period: string;
  paymentMode: "CASH" | "QRCODE";
  price: number | null;
  comment: string | null;
  createdAt: string;
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  durationMonths: number | null;
};

function getFullName(user: { firstName?: string | null; lastName?: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
}

function toDateInput(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().split("T")[0];
}

export default function AdminSecretEdit() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [subscriptionEndDate, setSubscriptionEndDate] = useState("");
  const [sessionCount, setSessionCount] = useState("");
  const [savingUser, setSavingUser] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [editingPaymentId, setEditingPaymentId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<Partial<Payment>>({});
  const [savingPaymentId, setSavingPaymentId] = useState<number | null>(null);

  const [message, setMessage] = useState<{ text: string; error?: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data: User[]) => setUsers(data))
      .catch(console.error);
  }, []);

  function flash(text: string, error = false) {
    setMessage({ text, error });
    setTimeout(() => setMessage(null), 3000);
  }

  function selectUser(user: User) {
    setSelectedUser(user);
    setSearch(getFullName(user));
    setSubscriptionEndDate(toDateInput(user.subscriptionEndDate ?? null));
    setSessionCount(user.sessionCount != null ? String(user.sessionCount) : "0");
    setEditingPaymentId(null);
    loadPayments(user.id);
  }

  async function loadPayments(memberId: number) {
    setLoadingPayments(true);
    try {
      const res = await fetch(`/api/payments/member/${memberId}`);
      if (!res.ok) throw new Error(`Erreur HTTP: ${res.status}`);
      setPayments(await res.json());
    } catch (err) {
      flash(err instanceof Error ? err.message : "Impossible de charger l'historique", true);
    } finally {
      setLoadingPayments(false);
    }
  }

  async function saveSubscriptionEndDate() {
    if (!selectedUser || !subscriptionEndDate) return;
    setSavingUser(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionEndDate: new Date(subscriptionEndDate).toISOString() }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Erreur HTTP: ${res.status}`);
      const updated = await res.json();
      setSelectedUser((u) => (u ? { ...u, subscriptionEndDate: updated.subscriptionEndDate } : u));
      setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, subscriptionEndDate: updated.subscriptionEndDate } : u)));
      flash("Date d'abonnement mise à jour");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Échec de la mise à jour", true);
    } finally {
      setSavingUser(false);
    }
  }

  async function saveSessionCount() {
    if (!selectedUser || sessionCount === "") return;
    setSavingUser(true);
    try {
      const res = await fetch(`/api/users/${selectedUser.id}/session-count`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionCount: Number(sessionCount) }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Erreur HTTP: ${res.status}`);
      const updated = await res.json();
      setSelectedUser((u) => (u ? { ...u, sessionCount: updated.sessionCount } : u));
      setUsers((list) => list.map((u) => (u.id === updated.id ? { ...u, sessionCount: updated.sessionCount } : u)));
      flash("Nombre de séances mis à jour");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Échec de la mise à jour", true);
    } finally {
      setSavingUser(false);
    }
  }

  function startEditPayment(payment: Payment) {
    setEditingPaymentId(payment.id);
    setEditForm({
      type: payment.type,
      period: payment.period,
      price: payment.price,
      paymentMode: payment.paymentMode,
      subscriptionStartDate: payment.subscriptionStartDate ? toDateInput(payment.subscriptionStartDate) as unknown as string : null,
      subscriptionEndDate: payment.subscriptionEndDate ? toDateInput(payment.subscriptionEndDate) as unknown as string : null,
      durationMonths: payment.durationMonths,
    });
  }

  async function savePayment(paymentId: number) {
    setSavingPaymentId(paymentId);
    try {
      const res = await fetch(`/api/payments/${paymentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: editForm.type,
          period: editForm.period,
          price: editForm.price === null || editForm.price === undefined ? null : Number(editForm.price),
          paymentMode: editForm.paymentMode,
          subscriptionStartDate: editForm.subscriptionStartDate || null,
          subscriptionEndDate: editForm.subscriptionEndDate || null,
          durationMonths: editForm.durationMonths === null || editForm.durationMonths === undefined || editForm.durationMonths === ("" as unknown)
            ? null
            : Number(editForm.durationMonths),
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || `Erreur HTTP: ${res.status}`);
      const updated = await res.json();
      setPayments((list) => list.map((p) => (p.id === paymentId ? updated : p)));
      setEditingPaymentId(null);
      flash("Paiement mis à jour");
    } catch (err) {
      flash(err instanceof Error ? err.message : "Échec de la mise à jour", true);
    } finally {
      setSavingPaymentId(null);
    }
  }

  const filteredUsers = search && !selectedUser
    ? users.filter((u) => getFullName(u).toLowerCase().includes(search.toLowerCase()))
    : [];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-[#1E2A47] mb-1">Correction abonnements &amp; séances</h1>
        <p className="text-sm text-gray-500 mb-6">Page d'administration restreinte — ne pas partager ce lien.</p>

        {message && (
          <div className={`mb-4 p-3 rounded text-sm ${message.error ? "bg-red-100 text-red-700 border border-red-300" : "bg-green-100 text-green-700 border border-green-300"}`}>
            {message.text}
          </div>
        )}

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher un membre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              if (!e.target.value) {
                setSelectedUser(null);
                setPayments([]);
              }
            }}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />

          {filteredUsers.length > 0 && (
            <div className="border border-gray-300 rounded max-h-56 overflow-y-auto mt-2">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => selectUser(user)}
                  className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  <div className="font-medium">{getFullName(user)}</div>
                  <div className="text-xs text-gray-500">
                    {user.role === "TRAINER" ? "Entraîneur" : "Utilisateur"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedUser && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="font-medium text-[#1E2A47]">{getFullName(selectedUser)}</h2>
                <button
                  type="button"
                  onClick={() => { setSelectedUser(null); setSearch(""); setPayments([]); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline"
                >
                  Changer de membre
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Fin d'abonnement</label>
                  <div className="flex gap-2">
                    <input
                      type="date"
                      value={subscriptionEndDate}
                      onChange={(e) => setSubscriptionEndDate(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      disabled={savingUser || !subscriptionEndDate}
                      onClick={saveSubscriptionEndDate}
                      className="px-3 py-1 rounded bg-[#1E2A47] text-white text-sm hover:bg-[#2A3B5A] disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-600 mb-1">Séances restantes</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      value={sessionCount}
                      onChange={(e) => setSessionCount(e.target.value)}
                      className="flex-1 border border-gray-300 rounded px-2 py-1 text-sm"
                    />
                    <button
                      type="button"
                      disabled={savingUser || sessionCount === ""}
                      onClick={saveSessionCount}
                      className="px-3 py-1 rounded bg-[#1E2A47] text-white text-sm hover:bg-[#2A3B5A] disabled:opacity-50"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-medium text-[#1E2A47] mb-3">Historique des paiements</h2>

              {loadingPayments ? (
                <p className="text-sm text-gray-500">Chargement...</p>
              ) : payments.length === 0 ? (
                <p className="text-sm text-gray-500">Aucun paiement enregistré</p>
              ) : (
                <div className="space-y-3">
                  {payments.map((payment) => (
                    <div key={payment.id} className="border border-gray-200 rounded p-3">
                      {editingPaymentId === payment.id ? (
                        <div className="space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Type</label>
                              <select
                                value={editForm.type ?? "FORFAIT"}
                                onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value as Payment["type"] }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="FORFAIT">Forfait séances</option>
                                <option value="ENTREE">Abonnement</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Formule / période</label>
                              <input
                                type="text"
                                value={editForm.period ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, period: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Montant payé (€)</label>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={editForm.price ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, price: e.target.value === "" ? null : Number(e.target.value) }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Mode de paiement</label>
                              <select
                                value={editForm.paymentMode ?? "CASH"}
                                onChange={(e) => setEditForm((f) => ({ ...f, paymentMode: e.target.value as Payment["paymentMode"] }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              >
                                <option value="CASH">Cash</option>
                                <option value="QRCODE">QR Code</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Date de début</label>
                              <input
                                type="date"
                                value={(editForm.subscriptionStartDate as string) ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, subscriptionStartDate: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Date de fin</label>
                              <input
                                type="date"
                                value={(editForm.subscriptionEndDate as string) ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, subscriptionEndDate: e.target.value }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-gray-500 mb-1">Durée (mois)</label>
                              <input
                                type="number"
                                min="0"
                                value={editForm.durationMonths ?? ""}
                                onChange={(e) => setEditForm((f) => ({ ...f, durationMonths: e.target.value === "" ? null : Number(e.target.value) }))}
                                className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => setEditingPaymentId(null)}
                              className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                              disabled={savingPaymentId === payment.id}
                            >
                              Annuler
                            </button>
                            <button
                              type="button"
                              onClick={() => savePayment(payment.id)}
                              disabled={savingPaymentId === payment.id}
                              className="px-3 py-1 rounded bg-[#1E2A47] text-white text-sm hover:bg-[#2A3B5A] disabled:opacity-50"
                            >
                              {savingPaymentId === payment.id ? "Enregistrement..." : "Enregistrer"}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div className="text-sm">
                            <div className="font-medium">
                              {payment.type === "FORFAIT" ? "Forfait séances" : "Abonnement"} — {payment.period}
                            </div>
                            <div className="text-gray-500 text-xs mt-0.5">
                              {new Date(payment.createdAt).toLocaleDateString("fr-FR")} • {payment.paymentMode === "CASH" ? "Cash" : "QR Code"} • {payment.price != null ? `${payment.price} €` : "—"}
                              {payment.subscriptionStartDate && payment.subscriptionEndDate && (
                                <> • du {new Date(payment.subscriptionStartDate).toLocaleDateString("fr-FR")} au {new Date(payment.subscriptionEndDate).toLocaleDateString("fr-FR")}</>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => startEditPayment(payment)}
                            className="text-xs text-blue-600 hover:underline whitespace-nowrap ml-3"
                          >
                            Modifier
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
