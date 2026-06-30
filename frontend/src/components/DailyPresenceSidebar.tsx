import React, { useState, useEffect, useRef } from "react";
import type { User } from "../types/commandes.types";

type Presence = {
  id: number;
  memberId: number;
  arrivedAt: string;
  member: {
    id: number;
    firstName: string | null;
    lastName: string | null;
  };
};

type Props = {
  users: User[];
};

function getFullName(user: { firstName?: string | null; lastName?: string | null }) {
  const parts = [user.firstName, user.lastName].filter(Boolean);
  return parts.length > 0 ? parts.join(" ") : "Utilisateur sans nom";
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
      if (res.ok) {
        setPresences(await res.json());
      }
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

  return (
    <aside className="w-[300px] flex-shrink-0 border-l border-gray-200 bg-white flex flex-col h-screen sticky top-0">
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">
          Présences du jour
        </h2>
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            placeholder="Ajouter un membre..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setShowDropdown(true);
            }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none"
          />
          {showDropdown && filteredUsers.length > 0 && (
            <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-300 rounded shadow-lg max-h-52 overflow-y-auto mt-1">
              {filteredUsers.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onMouseDown={() => handleSelectUser(user)}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 border-b last:border-b-0 transition-colors"
                >
                  {getFullName(user)}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {presences.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">
            Aucune présence aujourd'hui
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {presences.map((p) => (
              <li key={p.id} className="px-4 py-2.5 text-sm text-gray-800">
                {getFullName(p.member)}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-400 text-right">
        {presences.length} présence{presences.length !== 1 ? "s" : ""}
      </div>
    </aside>
  );
}
