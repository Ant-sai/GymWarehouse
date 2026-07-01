import { useState, useEffect, useRef } from "react";
import type { User } from "../types/commandes.types";

type Presence = {
  id: number;
  memberId: number;
  arrivedAt: string;
  member: {
    id: number;
    firstName: string | null;
    lastName: string | null;
    subscriptionEndDate: string | null;
  };
};

type Props = {
  users: User[];
};

function getFullName(user: { firstName?: string | null; lastName?: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
}

function getSubStatus(endDate: string | null): "domi" | "valid" | "expired" | "none" {
  if (!endDate) return "none";
  const d = new Date(endDate);
  if (d.getFullYear() >= 2099) return "domi";
  return d >= new Date() ? "valid" : "expired";
}

function getSubTooltip(endDate: string | null): string {
  const status = getSubStatus(endDate);
  if (status === "none") return "Pas d'abonnement";
  if (status === "domi") return "Domiciliation (sans limite)";
  const formatted = new Date(endDate!).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  return status === "valid"
    ? `${formatted}`
    : `Expiré le ${formatted}`;
}

export function DailyPresenceSidebar({ users }: Props) {
  const [presences, setPresences] = useState<Presence[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

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
    try {
      const res = await fetch("/api/daily-presence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId: user.id }),
      });
      if (res.ok) {
        const presence: Presence = await res.json();
        setPresences((prev) => [presence, ...prev]);
      }
    } catch (err) {
      console.error("Error adding presence:", err);
    }
  }

  async function handleRemove(id: number) {
    try {
      const res = await fetch(`/api/daily-presence/${id}`, { method: "DELETE" });
      if (res.ok) setPresences((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Error removing presence:", err);
    }
  }

  return (
    <aside className="w-[150px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Présences
        </h2>
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
      </div>

      <div className="flex-1 overflow-y-auto">
        {presences.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">Aucune présence</p>
        ) : (
          <ul>
            {presences.map((p) => {
              const status = getSubStatus(p.member.subscriptionEndDate);
              const nameColor =
                status === "valid" || status === "domi"
                  ? "text-green-700"
                  : "text-red-600";
              return (
                <li
                  key={p.id}
                  className="px-2 py-2 flex items-center justify-between group border-b border-gray-100"
                >
                  <span
                    title={getSubTooltip(p.member.subscriptionEndDate)}
                    className={`text-xs truncate flex-1 cursor-default ${nameColor}`}
                  >
                    {getFullName(p.member)}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemove(p.id)}
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
    </aside>
  );
}
