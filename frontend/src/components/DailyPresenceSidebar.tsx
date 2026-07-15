import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import type { User } from "../types/commandes.types";
import { AddMemberModal } from "./Modals/AddMemberModal";
import { AbonnementModal } from "./Modals/AbonnementModal";

type Presence = {
  id: number;
  memberId: number;
  arrivedAt: string;
  usedSession?: boolean;
  member: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    subscriptionEndDate: string | null;
    sessionCount: number | null;
  };
};

type Props = {
  users: User[];
  onUserAdded?: () => void;
};

function getFullName(user: { firstName?: string | null; lastName?: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
}

function daysUntilExpiry(endDate: string | null): number | null {
  if (!endDate) return null;
  const d = new Date(endDate);
  if (d.getFullYear() >= 2099) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

// La couleur dépend du type d'entrée choisi lors du pointage (abonnement ou séance unitaire),
// pas d'un mélange des deux statuts.
function getNameColor(p: Presence): string {
  if (p.usedSession) {
    // Entrée unitaire : le compteur peut désormais devenir négatif
    const remaining = p.member.sessionCount;
    if (remaining == null || remaining < 0) return "text-red-600";
    if (remaining === 0) return "text-orange-500 underline"; // vient de pointer sa dernière séance
    return "text-green-700";
  }

  // Abonnement
  const endDate = p.member.subscriptionEndDate;
  if (!endDate) return "text-red-600";
  const d = new Date(endDate);
  if (d.getFullYear() >= 2099) return "text-green-700"; // domiciliation
  const days = daysUntilExpiry(endDate);
  if (days === null) return "text-green-700";
  if (days < 0) return "text-red-600";
  if (days <= 3) return "text-orange-500 underline";
  return "text-green-700";
}

function getSubTooltip(endDate: string | null, sessionCount: number | null | undefined): string {
  const parts: string[] = [];

  if (sessionCount !== null && sessionCount !== undefined) {
    parts.push(`${sessionCount} séance${sessionCount !== 1 ? "s" : ""} restante${sessionCount !== 1 ? "s" : ""}`);
  }

  if (!endDate) {
    if (parts.length === 0) parts.push("Pas d'abonnement");
  } else {
    const d = new Date(endDate);
    if (d.getFullYear() >= 2099) {
      parts.push("Domiciliation (sans limite)");
    } else {
      const formatted = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      const days = daysUntilExpiry(endDate);
      if (days !== null && days < 0) {
        parts.push(`Expiré le ${formatted}`);
      } else if (days !== null && days <= 3) {
        parts.push(`Expire le ${formatted} (dans ${days} j.)`);
      } else {
        parts.push(formatted);
      }
    }
  }

  return parts.join(" · ");
}

export function DailyPresenceSidebar({ users, onUserAdded }: Props) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showChoiceModal, setShowChoiceModal] = useState(false);
  const [showRenewChoiceModal, setShowRenewChoiceModal] = useState(false);
  const [showAbonnementModal, setShowAbonnementModal] = useState(false);
  const [pendingUser, setPendingUser] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchPresences();
  }, []);

  async function fetchPresences() {
    try {
      const res = await fetch("/api/daily-presence");
      if (res.ok) setPresences(await res.json());
    } catch (err) {
      console.error("Error fetching presences:", err);
    }
  }

  const filteredUsers =
    search.trim().length > 0
      ? users.filter((u) =>
          getFullName(u).toLowerCase().includes(search.toLowerCase())
        )
      : [];

  async function handleSelectUser(user: User) {
    setSearch("");
    setShowDropdown(false);

    const hasActiveSub = user.subscriptionEndDate != null && new Date(user.subscriptionEndDate) >= new Date();
    const hasSessions = user.sessionCount != null && user.sessionCount > 0;

    if (hasActiveSub && hasSessions) {
      setPendingUser(user);
      setShowChoiceModal(true);
      return;
    }

    if (hasSessions && !hasActiveSub) {
      setPendingUser(user);
      setShowRenewChoiceModal(true);
      return;
    }

    await submitPresence(user, false);
  }

  async function submitPresence(user: User, useSession: boolean) {
    setShowChoiceModal(false);
    setShowRenewChoiceModal(false);
    setPendingUser(null);
    try {
      const res = await fetch("/api/daily-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id, useSession }),
      });
      if (res.ok) {
        const presence: Presence = await res.json();
        setPresences((prev) => [{ ...presence, usedSession: useSession }, ...prev]);
      }
    } catch (err) {
      console.error("Error adding presence:", err);
    }
  }

  async function handleRemove(presence: Presence) {
    try {
      const url = presence.usedSession
        ? `/api/daily-presence/${presence.id}?refund=true`
        : `/api/daily-presence/${presence.id}`;
      const res = await fetch(url, { method: "DELETE" });
      if (res.ok) setPresences((prev) => prev.filter((p) => p.id !== presence.id));
    } catch (err) {
      console.error("Error removing presence:", err);
    }
  }

  async function handleAbonnementSuccess() {
    const user = pendingUser;
    setShowAbonnementModal(false);
    setPendingUser(null);
    if (user) await submitPresence(user, false);
    onUserAdded?.();
  }

  async function handleAddMember(userData: Partial<User>): Promise<User> {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || "Impossible d'ajouter le membre");
    }
    const newUser = await response.json();
    onUserAdded?.();
    return newUser;
  }

  return (
    <aside className="w-[150px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-screen sticky top-0 overflow-x-hidden">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Présences
          </h2>
          <span
            title="Membres présents aujourd'hui"
            className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-[#1E2A47] text-white text-[11px] font-semibold"
          >
            {presences.length}
          </span>
        </div>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ajouter..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full border border-gray-300 rounded px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {showDropdown && filteredUsers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded shadow-lg max-h-52 overflow-y-auto mt-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={() => handleSelectUser(user)}
                  className="w-full text-left px-2 py-1.5 text-xs hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  <div>{user.firstName ?? ""}</div>
                  <div>{user.lastName ?? ""}</div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Bouton ajout membre */}
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          title="Ajouter un nouveau membre"
          className="mt-2 w-full text-xs text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded py-1 transition-colors flex items-center justify-center gap-1 border border-dashed border-gray-300 hover:border-blue-400"
        >
          <span className="text-base leading-none">+</span>
          <span>Nouveau membre</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {presences.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Aucune présence</p>
        ) : (
          <ul>
            {presences.map((p) => {
              const nameColor = getNameColor(p);
              const tooltip = getSubTooltip(p.member.subscriptionEndDate, p.member.sessionCount);
              return (
                <li
                  key={p.id}
                  className="px-2 py-2 flex items-center justify-between group border-b border-gray-100"
                >
                  <button
                    type="button"
                    title={tooltip}
                    onClick={() => navigate(`/membres?search=${encodeURIComponent(getFullName(p.member))}`)}
                    className={`text-[10px] flex-1 text-left hover:underline min-w-0 ${nameColor}`}
                  >
                    <div className="truncate">{p.member.firstName ?? ""}</div>
                    <div className="truncate">{p.member.lastName ?? ""}</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRemove(p)}
                    title="Retirer"
                    className="ml-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity text-xs flex-shrink-0"
                  >
                    ✕
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="px-3 py-1.5 border-t border-gray-100 text-xs text-gray-400 text-right">
        {presences.length} présence{presences.length !== 1 ? "s" : ""}
      </div>

      <AddMemberModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddMember}
      />

      {showChoiceModal && pendingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowChoiceModal(false); setPendingUser(null); }} />
          <div className="relative bg-white rounded-lg p-5 w-64 shadow-lg z-50">
            <p className="text-lg font-medium text-gray-800 mb-4 text-center">{getFullName(pendingUser)}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => submitPresence(pendingUser, false)}
                className="flex-1 py-2 rounded-lg border-2 border-[#1E2A47] bg-[#1E2A47] text-white text-xs font-medium hover:bg-[#2A3B5A]"
              >
                Abonnement
              </button>
              <button
                type="button"
                onClick={() => submitPresence(pendingUser, true)}
                className="flex-1 py-2 rounded-lg border-2 border-blue-600 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
              >
                Séance
              </button>
            </div>
          </div>
        </div>
      )}

      {showRenewChoiceModal && pendingUser && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setShowRenewChoiceModal(false); setPendingUser(null); }} />
          <div className="relative bg-white rounded-lg p-5 w-64 shadow-lg z-50">
            <p className="text-sm font-medium text-gray-800 mb-1">{getFullName(pendingUser)}</p>
            <p className="text-xs text-gray-500 mb-4">Abonnement expiré, séances disponibles.<br />Comment enregistrer cette présence ?</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => { setShowRenewChoiceModal(false); setShowAbonnementModal(true); }}
                className="flex-1 py-2 rounded-lg border-2 border-[#1E2A47] bg-[#1E2A47] text-white text-xs font-medium hover:bg-[#2A3B5A]"
              >
                Abonnement
              </button>
              <button
                type="button"
                onClick={() => submitPresence(pendingUser, true)}
                className="flex-1 py-2 rounded-lg border-2 border-blue-600 bg-blue-600 text-white text-xs font-medium hover:bg-blue-700"
              >
                Séance
              </button>
            </div>
          </div>
        </div>
      )}

      {showAbonnementModal && pendingUser && (
        <AbonnementModal
          users={users}
          initialUser={pendingUser}
          onClose={() => { setShowAbonnementModal(false); setPendingUser(null); }}
          onSuccess={handleAbonnementSuccess}
        />
      )}
    </aside>
  );
}
