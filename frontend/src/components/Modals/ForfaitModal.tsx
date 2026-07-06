import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../../types/commandes.types";

type SessionPassPrice = { id: number; sessions: number; label: string; price: number };

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

export function ForfaitModal({ users, initialUser, onClose, onSuccess }: Props) {
  const navigate = useNavigate();
  const [forfaitUser, setForfaitUser] = useState<User | null>(initialUser ?? null);
  const [forfaitUserSearch, setForfaitUserSearch] = useState(initialUser ? getFullName(initialUser) : "");
  const [forfaitSessions, setForfaitSessions] = useState<number | null>(null);
  const [forfaitPrice, setForfaitPrice] = useState<string>("");
  const [forfaitPayment, setForfaitPayment] = useState<"CASH" | "QRCODE" | null>(null);
  const [saving, setSaving] = useState(false);
  const [sessionPassPrices, setSessionPassPrices] = useState<SessionPassPrice[]>([]);

  useEffect(() => {
    fetch("/api/session-pass-prices")
      .then(r => r.json())
      .then(data => setSessionPassPrices(data.map((p: SessionPassPrice) => ({ ...p, price: Number(p.price) }))))
      .catch(console.error);
  }, []);

  async function handleSave() {
    if (!forfaitUser) { alert("Veuillez sélectionner un membre"); return; }
    if (!forfaitSessions) { alert("Veuillez sélectionner un forfait"); return; }

    setSaving(true);
    try {
      const response = await fetch("/api/session-passes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberId: forfaitUser.id,
          sessions: forfaitSessions,
          amount: forfaitPrice !== "" ? Number(forfaitPrice) : undefined,
          paymentMethod: forfaitPayment ?? undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      onSuccess?.();
      navigate("/commandes");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Impossible d'enregistrer le forfait");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white rounded-lg p-6 w-[420px] shadow-lg z-50">
        <h3 className="text-lg font-semibold mb-4 text-black">Forfait séances</h3>

        <div className="space-y-4">
          {/* Recherche membre */}
          <div>
            <input
              type="text"
              placeholder="Rechercher un membre..."
              value={forfaitUserSearch}
              onChange={(e) => { setForfaitUserSearch(e.target.value); if (!e.target.value) setForfaitUser(null); }}
              className="w-full mb-2 border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {forfaitUserSearch && !forfaitUser && (
              <div className="border border-gray-300 rounded max-h-40 overflow-y-auto mb-2">
                {users.filter(u => getFullName(u).toLowerCase().includes(forfaitUserSearch.toLowerCase())).length === 0 ? (
                  <div className="p-3 text-center text-gray-500 text-sm">Aucun membre trouvé</div>
                ) : (
                  users.filter(u => getFullName(u).toLowerCase().includes(forfaitUserSearch.toLowerCase())).map(user => (
                    <button key={user.id} type="button"
                      onClick={() => { setForfaitUser(user); setForfaitUserSearch(getFullName(user)); }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 border-b last:border-b-0 text-sm transition-colors">
                      <div className="font-medium">{getFullName(user)}</div>
                      {user.sessionCount !== null && user.sessionCount !== undefined && (
                        <div className="text-xs text-gray-500">
                          {user.sessionCount} séance{user.sessionCount !== 1 ? "s" : ""} restante{user.sessionCount !== 1 ? "s" : ""}
                        </div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
            {forfaitUser && (
              <div className="p-3 rounded border bg-blue-50 border-blue-300 flex justify-between items-center">
                <div>
                  <div className="font-medium text-sm text-black">{getFullName(forfaitUser)}</div>
                  {forfaitUser.sessionCount !== null && forfaitUser.sessionCount !== undefined && (
                    <div className="text-xs text-gray-600">
                      {forfaitUser.sessionCount} séance{forfaitUser.sessionCount !== 1 ? "s" : ""} restante{forfaitUser.sessionCount !== 1 ? "s" : ""}
                    </div>
                  )}
                </div>
                <button type="button" onClick={() => { setForfaitUser(null); setForfaitUserSearch(""); }}
                  className="text-xs text-gray-400 hover:text-gray-600 underline">Changer</button>
              </div>
            )}
          </div>

          {/* Sélection du forfait */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Nombre de séances</p>
            <div className="grid grid-cols-4 gap-2">
              {[1, 10, 20, 50].map(n => {
                const passPrice = sessionPassPrices.find(p => p.sessions === n)?.price;
                return (
                  <button key={n} type="button"
                    onClick={() => {
                      setForfaitSessions(n);
                      const p = sessionPassPrices.find(p => p.sessions === n)?.price;
                      setForfaitPrice(p ? String(p) : "");
                    }}
                    className={`flex flex-col items-center py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      forfaitSessions === n
                        ? "border-[#1E2A47] bg-[#1E2A47] text-white"
                        : "border-gray-300 text-gray-700 hover:border-[#1E2A47] hover:text-[#1E2A47]"
                    }`}>
                    <span>{n}</span>
                    {passPrice !== undefined && (
                      <span className="text-xs opacity-80">{passPrice > 0 ? `${passPrice} €` : "—"}</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Prix et paiement */}
          {forfaitSessions !== null && (
            <>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600 whitespace-nowrap">Prix :</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={forfaitPrice}
                  onChange={(e) => setForfaitPrice(e.target.value)}
                  className="w-28 border border-gray-300 rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-500">€</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">Mode de paiement <span className="text-gray-400 font-normal">(optionnel)</span></p>
                <div className="grid grid-cols-2 gap-2">
                  {(["CASH", "QRCODE"] as const).map(method => (
                    <button key={method} type="button"
                      onClick={() => setForfaitPayment(forfaitPayment === method ? null : method)}
                      className={`py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        forfaitPayment === method
                          ? "border-[#1E2A47] bg-[#1E2A47] text-white"
                          : "border-gray-300 text-gray-700 hover:border-[#1E2A47]"
                      }`}>
                      {method === "CASH" ? "💵 Cash" : "📱 QR Code"}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button type="button" onClick={onClose}
            className="px-4 py-2 rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
            disabled={saving}>
            Annuler
          </button>
          <button onClick={handleSave}
            disabled={saving || !forfaitUser || !forfaitSessions}
            className="px-4 py-2 rounded bg-[#1E2A47] text-white hover:bg-[#2A3B5A] disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? "Enregistrement..." : "Confirmer"}
          </button>
        </div>
      </div>
    </div>
  );
}
