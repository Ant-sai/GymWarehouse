import React, { useState } from "react";
export type Product = {
  id: string;
  name: string;
  quantity: number;
  description?: string;
  price: number;
  trainerPrice?: number;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([
    {
      id: "1",
      name: "Haltères 5kg",
      quantity: 10,
      description: "Jeu de 2 haltères en métal",
      price: 25,
      trainerPrice: 20,
    },
    {
      id: "2",
      name: "Tapis de yoga",
      quantity: 5,
      description: "Tapis confortable et antidérapant",
      price: 30,
      trainerPrice: 25,
    },
  ]);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    quantity: "",
    description: "",
    price: "",
    trainerPrice: "",
  });

  const [saving, setSaving] = useState(false);

  function handleAddProduct(e?: React.FormEvent) {
    e?.preventDefault();
    setSaving(true);

    const newProduct: Product = {
      id: Date.now().toString(),
      name: form.name,
      quantity: Number(form.quantity || 0),
      description: form.description,
      price: Number(form.price || 0),
      trainerPrice: Number(form.trainerPrice || 0),
    };

    setProducts((prev) => [newProduct, ...prev]);
    setShowForm(false);
    setForm({ name: "", quantity: "", description: "", price: "", trainerPrice: "" });
    setSaving(false);
  }

  function handleDelete(id: string) {
    if (!confirm("Supprimer ce produit ?")) return;
    setProducts((prev) => prev.filter((p) => p.id !== id));
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* Sidebar */}
      <aside className="w-60 bg-[#1E2A47] text-white p-8">
        <h2 className="text-xl font-semibold mb-8">Stock</h2>
        <nav className="space-y-4 text-sm opacity-90">
          <div className="font-medium">Stock</div>
          <div className="text-[#AAB4C3]">Membres</div>
          <div className="text-[#AAB4C3]">Commandes</div>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-12">
        <header className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-semibold text-black">Stock</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-[#F5EDE3] text-[#333333] px-4 py-2 rounded-lg shadow-sm"
          >
            Ajouter un produit
          </button>
        </header>

        {/* Table header */}
        <div className="grid grid-cols-6 gap-6 px-4 text-sm font-medium text-gray-700 mb-4">
          <div>Produits</div>
          <div>Quantités</div>
          <div className="col-span-2">Description</div>
          <div>Prix</div>
          <div>Prix Entraîneur</div>
        </div>

        {/* Content */}
        <div className="space-y-4 px-4">
          {products.length === 0 && <div className="text-gray-500">Aucun produit</div>}
          {products.map((p) => (
            <div
              key={p.id}
              className="bg-white rounded-lg p-4 shadow-sm grid grid-cols-6 items-center text-black"
            >
              <div className="truncate font-medium">{p.name}</div>
              <div>{p.quantity}</div>
              <div className="col-span-2 truncate text-sm text-gray-600">{p.description}</div>
              <div>{p.price} €</div>
              <div className="flex items-center justify-between">
                <span>{p.trainerPrice ?? "-"} €</span>
                <button onClick={() => handleDelete(p.id)} className="p-1 ml-2">
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

        {/* Modal form */}
        {showForm && (
          <div className="fixed inset-0 flex items-center justify-center z-40">
            <div className="absolute inset-0 bg-black/30" onClick={() => setShowForm(false)} />
            <form
              onSubmit={handleAddProduct}
              className="relative bg-white rounded-lg p-6 w-[720px] shadow-lg z-50"
            >
              <h3 className="text-xl font-semibold mb-4 text-black">Ajouter un produit</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm">Nom</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm">Quantité</label>
                  <input
                    type="number"
                    value={form.quantity}
                    onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm">Description</label>
                  <input
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm">Prix</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) => setForm({ ...form, price: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm">Prix Entraîneur</label>
                  <input
                    type="number"
                    value={form.trainerPrice}
                    onChange={(e) => setForm({ ...form, trainerPrice: e.target.value })}
                    className="mt-1 block w-full border border-gray-200 rounded px-3 py-2"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 rounded border"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded bg-[#1E2A47] text-white"
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
