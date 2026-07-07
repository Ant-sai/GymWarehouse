import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types/commandes.types";

type SubscriptionDuration = { id: number; duration: number; label: string; price: number };

type Props = {
  users: User[];
  initialUser?: User | null;
  onClose: () => void;
  onSuccess: () => void;
};

function getFullName(user: { firstName?: string | null; lastName?: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
}

export function AbonnementModal({ users, initialUser, onClose, onSuccess }: Props) {
  const navigate = useNavigate();
  const [abonnementUser, setAbonnementUser] = useState<User | null>(initialUser ?? null);
  const [abonnementUserSearch, setAbonnementUserSearch] = useState(initialUser ? getFullName(initialUser) : "");
  const [abonnementDate, setAbonnementDate] = useState<string>(() => {
    if (initialUser?.subscriptionEndDate) {
      return new Date(initialUser.subscriptionEndDate).toISOString().split("T")[0];
    }
    return "";
  });
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);
  const [abonnementPrice, setAbonnementPrice] = useState<string>("");
  const [abonnementPayment, setAbonnementPayment] = useState<"CASH" | "QRCODE" | null>(null);
  const [saving, setSaving] = useState(false);
  const [subscriptionDurations, setSubscriptionDurations] = useState<SubscriptionDuration[]>([]);

  useEffect(() => {
    fetch("/api/subscription-durations")
      .then(r => r.json())
      .then(data => setSubscriptionDurations(data.map((d: SubscriptionDuration) => ({ ...d, price: Number(d.price) }))))
      .catch(console.error);
  }, []);

  async function handleSave() {
    if (!abonnementUser) { alert("Veuillez sélectionner un membre"); return; }
    if (!abonnementDate) { alert("Veuillez sélectionner une durée"); return; }
    if (abonnementPrice === "" || isNaN(Number(abonnementPrice)) || Number(abonnementPrice) < 0) { alert("Veuillez indiquer le prix"); return; }
    if (!abonnementPayment) { alert("Veuillez sélectionner le mode de paiement"); return; }

    setSaving(true);
    try {
      const response = await fetch("/api/abonnement-payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: abonnementUser.id,
          subscriptionEndDate: new Date(abonnementDate).toISOString(),
          amount: Number(abonnementPrice),
          paymentMethod: abonnementPayment,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      onSuccess?.();
      navigate("/commandes");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible de mettre à jour l'abonnement");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[500px] shadow-lg z-50">

        <div className="space-y-4">
          {/* Recherche membre */}
          <div>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={abonnementUserSearch}
              onChange={(e) => {
                setAbonnementUserSearch(e.target.value);
                if (!e.target.value) setAbonnementUser(null);
              }}
              className="w-full mb-2 border border-gray-300 rounded px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />

            {abonnementUserSearch && !abonnementUser && (
              <div className="border border-gray-300 rounded max-h-48 overflow-y-auto mb-2">
                {users.filter(u => getFullName(u).toLowerCase().includes(abonnementUserSearch.toLowerCase())).length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Aucun membre trouvé</div>
                ) : (
                  users.filter(u => getFullName(u).toLowerCase().includes(abonnementUserSearch.toLowerCase())).map(user => (
                    <button key={user.id} type="button"
                      onClick={() => {
                        setAbonnementUser(user);
                        setAbonnementUserSearch(getFullName(user));
                        if (user.subscriptionEndDate) {
                          setAbonnementDate(new Date(user.subscriptionEndDate).toISOString().split("T")[0]);
                        }
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 transition-colors">
                      <div className="font-medium">{getFullName(user)}</div>
                      <div className="text-xs text-gray-500">
                        {user.role === "TRAINER" ? "Entraîneur" : "Utilisateur"}
                        {user.subscriptionEndDate && (
                          <span className="ml-2 text-orange-600">
                            {new Date(user.subscriptionEndDate).getFullYear() >= 2099
                              ? "• Domiciliation"
                              : `• Abonnement jusqu'au ${new Date(user.subscriptionEndDate).toLocaleDateString("fr-FR")}`}
                          </span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}

            {abonnementUser && (() => {
              const isValid = abonnementUser.subscriptionEndDate && new Date(abonnementUser.subscriptionEndDate) >= new Date();
              const isDomi = abonnementUser.subscriptionEndDate && new Date(abonnementUser.subscriptionEndDate).getFullYear() >= 2099;
              return (
                <div className={`p-3 rounded border ${isValid ? "bg-green-100 border-green-500" : "bg-red-100 border-red-500"}`}>
                  <div className="flex justify-between items-center mb-1">
                    <div className="font-medium text-black">{getFullName(abonnementUser)}</div>
                    <button type="button"
                      onClick={() => { setAbonnementUser(null); setAbonnementUserSearch(""); setAbonnementDate(""); setSelectedDuration(null); setAbonnementPrice(""); setAbonnementPayment(null); }}
                      className="text-xs text-gray-400 hover:text-gray-600 underline">
                      Changer
                    </button>
                  </div>
                  {abonnementUser.subscriptionEndDate ? (
                    <div className={`text-base font-semibold ${isValid ? "text-green-700" : "text-red-700"}`}>
                      {isDomi
                        ? "Domiciliation (sans limite)"
                        : new Date(abonnementUser.subscriptionEndDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </div>
                  ) : (
                    <div className="text-sm font-medium text-red-700">Pas d'abonnement</div>
                  )}
                </div>
              );
            })()}
          </div>

          {/* Boutons durées */}
          <div>
            <div className="grid grid-cols-5 gap-2 mb-3">
              {[
                { label: "1 mois", months: 1 },
                { label: "3 mois", months: 3 },
                { label: "6 mois", months: 6 },
                { label: "12 mois", months: 12 },
                { label: "Domi", months: 999 },
              ].map(({ label, months }) => {
                const durPrice = subscriptionDurations.find(d => d.duration === months)?.price;
                return (
                  <button key={months} type="button"
                    onClick={() => {
                      if (months === 999) {
                        setAbonnementDate("2099-12-31");
                        setSelectedDuration(999);
                        return;
                      }
                      const hasActive = abonnementUser?.subscriptionEndDate && new Date(abonnementUser.subscriptionEndDate) >= new Date();
                      const base = hasActive ? new Date(abonnementUser!.subscriptionEndDate!) : new Date();
                      base.setMonth(base.getMonth() + months);
                      base.setDate(base.getDate() - 1);
                      setAbonnementDate(base.toISOString().split("T")[0]);
                      setSelectedDuration(months);
                      const p = subscriptionDurations.find(d => d.duration === months)?.price;
                      setAbonnementPrice(p ? String(p) : "");
                    }}
                    className={`flex flex-col items-center px-2 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      selectedDuration === months
                        ? "border-[#1E2A47] bg-[#1E2A47] text-white"
                        : selectedDuration !== null
                        ? "border-gray-200 text-gray-400 cursor-not-allowed"
                        : "border-[#1E2A47] text-[#1E2A47] hover:bg-[#1E2A47] hover:text-white"
                    }`}
                    disabled={selectedDuration !== null && selectedDuration !== months}>
                    <span>{label}</span>
                    {durPrice !== undefined && (
                      <span className="text-xs mt-0.5 opacity-80">{durPrice > 0 ? `${durPrice} €` : "—"}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {selectedDuration !== null && (
              <button type="button"
                onClick={() => { setSelectedDuration(null); setAbonnementDate(""); setAbonnementPrice(""); setAbonnementPayment(null); }}
                className="text-xs text-gray-400 hover:text-gray-600 mb-3">
                ✕ Changer la durée
              </button>
            )}

            {selectedDuration !== null && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600 whitespace-nowrap">Prix :</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={abonnementPrice}
                    onChange={(e) => setAbonnementPrice(e.target.value)}
                    className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-500">€</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Mode de paiement *</p>
                  <div className="grid grid-cols-2 gap-2">
                    {(["CASH", "QRCODE"] as const).map(method => (
                      <button key={method} type="button"
                        onClick={() => setAbonnementPayment(abonnementPayment === method ? null : method)}
                        className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                          abonnementPayment === method
                            ? "border-[#1E2A47] bg-[#1E2A47] text-white"
                            : "border-gray-300 text-gray-700 hover:border-[#1E2A47]"
                        }`}>
                        {method === "CASH" ? "💵 Cash" : "📱 QR Code"}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {abonnementDate && (
              <p className="text-base font-semibold text-emerald-700 mt-2">
                {abonnementDate === "2099-12-31"
                  ? "Domiciliation (sans limite)"
                  : abonnementUser?.subscriptionEndDate && new Date(abonnementUser.subscriptionEndDate) >= new Date()
                  ? new Date(abonnementDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
                  : `Jusqu'au ${new Date(abonnementDate).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}`}
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={saving}>
            Annuler
          </button>
          <button onClick={handleSave}
            disabled={saving || !abonnementUser || !abonnementDate || abonnementPrice === "" || !abonnementPayment}
            className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Enregistrement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
