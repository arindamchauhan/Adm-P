"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Plus, Save, Trash2 } from "lucide-react";
import { useRealtimeSync } from "@/hooks/useRealtimeSync";

interface AdminCollab {
  _id: string;
  creatorName: string;
  instagramUrl: string;
  thumbnailUrl: string;
  caption: string;
  viewsLabel?: string;
  isActive: boolean;
  sortOrder: number;
}

const EMPTY_FORM = {
  creatorName: "",
  instagramUrl: "",
  thumbnailUrl: "",
  caption: "",
  viewsLabel: "",
  isActive: true,
};

export default function AdminCollabsPage() {
  const [collabs, setCollabs] = useState<AdminCollab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saveMessage, setSaveMessage] = useState("");
  const [createForm, setCreateForm] = useState(EMPTY_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState(EMPTY_FORM);

  const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

  const fetchCollabs = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/collabs?includeInactive=true");
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to fetch collabs");
      }
      setCollabs((data.collabs || []).sort((a: AdminCollab, b: AdminCollab) => a.sortOrder - b.sortOrder));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to fetch collabs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCollabs();
  }, []);

  useRealtimeSync({
    onEvent: (event) => {
      if (event.entity === 'collab') {
        fetchCollabs();
      }
    },
  });

  const moveItem = (index: number, direction: "up" | "down") => {
    const next = [...collabs];
    const target = direction === "up" ? index - 1 : index + 1;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setCollabs(next.map((item, idx) => ({ ...item, sortOrder: idx })));
    setSaveMessage("Reordered locally. Click Save Order.");
  };

  const saveOrder = async () => {
    if (!token) {
      setError("Admin session expired. Please login again.");
      return;
    }

    setError("");
    setSaveMessage("");

    try {
      const ids = collabs.map((item) => item._id);
      const response = await fetch("/api/collabs/reorder", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save order");
      }
      setSaveMessage("Order saved successfully.");
      await fetchCollabs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save order");
    }
  };

  const createCollab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      setError("Admin session expired. Please login again.");
      return;
    }

    try {
      const response = await fetch("/api/collabs", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(createForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to create collab");
      }
      setCreateForm(EMPTY_FORM);
      setSaveMessage("Collab video created.");
      await fetchCollabs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to create collab");
    }
  };

  const startEdit = (item: AdminCollab) => {
    setEditId(item._id);
    setEditForm({
      creatorName: item.creatorName,
      instagramUrl: item.instagramUrl,
      thumbnailUrl: item.thumbnailUrl,
      caption: item.caption,
      viewsLabel: item.viewsLabel || "",
      isActive: item.isActive,
    });
  };

  const updateCollab = async (id: string) => {
    if (!token) {
      setError("Admin session expired. Please login again.");
      return;
    }

    try {
      const response = await fetch(`/api/collabs/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to update collab");
      }
      setEditId(null);
      setSaveMessage("Collab video updated.");
      await fetchCollabs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to update collab");
    }
  };

  const deleteCollab = async (id: string) => {
    if (!token) {
      setError("Admin session expired. Please login again.");
      return;
    }

    if (!window.confirm("Delete this collab video?")) return;

    try {
      const response = await fetch(`/api/collabs/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to delete collab");
      }
      setSaveMessage("Collab video removed.");
      await fetchCollabs();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete collab");
    }
  };

  const total = useMemo(() => collabs.length, [collabs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-heading text-dark-text">Creator Collabs</h1>
          <p className="text-gray-600">Create, edit, remove, and reorder Instagram collab videos.</p>
        </div>
        <button
          onClick={saveOrder}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gold text-white font-semibold hover:brightness-105"
        >
          <Save size={16} />
          Save Order
        </button>
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {saveMessage ? <p className="text-sm text-green-700">{saveMessage}</p> : null}

      <form onSubmit={createCollab} className="bg-white border border-gray-200 rounded-xl p-5 space-y-3">
        <h2 className="font-semibold text-dark-text inline-flex items-center gap-2">
          <Plus size={16} />
          Add New Collab Video
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            required
            value={createForm.creatorName}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, creatorName: e.target.value }))}
            placeholder="Creator handle (e.g. @creator_name)"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            required
            value={createForm.viewsLabel}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, viewsLabel: e.target.value }))}
            placeholder="Views label (e.g. 54K views)"
            className="px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            required
            value={createForm.instagramUrl}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
            placeholder="Instagram post/reel URL"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <input
            required
            value={createForm.thumbnailUrl}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
            placeholder="Thumbnail image URL"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg"
          />
          <textarea
            required
            value={createForm.caption}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, caption: e.target.value }))}
            placeholder="Caption"
            className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg min-h-[80px]"
          />
        </div>
        <label className="inline-flex items-center gap-2 text-sm text-dark-text">
          <input
            type="checkbox"
            checked={createForm.isActive}
            onChange={(e) => setCreateForm((prev) => ({ ...prev, isActive: e.target.checked }))}
          />
          Active
        </label>
        <div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-dark-text text-white font-semibold">
            Create
          </button>
        </div>
      </form>

      <div className="bg-white border border-gray-200 rounded-xl overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Order</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Creator</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Caption</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="px-4 py-4 text-sm text-gray-500" colSpan={5}>
                  Loading collab videos...
                </td>
              </tr>
            ) : null}

            {!loading && total === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-gray-500" colSpan={5}>
                  No collab videos yet.
                </td>
              </tr>
            ) : null}

            {collabs.map((item, index) => {
              const isEditing = editId === item._id;
              return (
                <tr key={item._id} className="border-b border-gray-200 align-top">
                  <td className="px-4 py-4 text-sm text-gray-700">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => moveItem(index, "up")}
                        disabled={index === 0}
                        className="p-1 border border-gray-300 rounded disabled:opacity-40"
                        title="Move up"
                      >
                        <ArrowUp size={14} />
                      </button>
                      <button
                        onClick={() => moveItem(index, "down")}
                        disabled={index === collabs.length - 1}
                        className="p-1 border border-gray-300 rounded disabled:opacity-40"
                        title="Move down"
                      >
                        <ArrowDown size={14} />
                      </button>
                      <span className="ml-2">{index + 1}</span>
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    {isEditing ? (
                      <input
                        value={editForm.creatorName}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, creatorName: e.target.value }))}
                        className="w-full px-2 py-1 border border-gray-300 rounded"
                      />
                    ) : (
                      <div>
                        <p className="font-semibold text-dark-text">{item.creatorName}</p>
                        <a
                          href={item.instagramUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 hover:underline break-all"
                        >
                          {item.instagramUrl}
                        </a>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm text-gray-700">
                    {isEditing ? (
                      <div className="space-y-2">
                        <textarea
                          value={editForm.caption}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, caption: e.target.value }))}
                          className="w-full px-2 py-1 border border-gray-300 rounded min-h-[70px]"
                        />
                        <input
                          value={editForm.thumbnailUrl}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, thumbnailUrl: e.target.value }))}
                          placeholder="Thumbnail URL"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                        <input
                          value={editForm.viewsLabel}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, viewsLabel: e.target.value }))}
                          placeholder="Views label"
                          className="w-full px-2 py-1 border border-gray-300 rounded"
                        />
                        <label className="inline-flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.checked }))}
                          />
                          Active
                        </label>
                      </div>
                    ) : (
                      <div>
                        <p className="line-clamp-2">{item.caption}</p>
                        <p className="text-xs text-gray-500 mt-1">{item.viewsLabel || "-"}</p>
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${
                        item.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {item.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div className="flex items-center gap-2 justify-center">
                      {isEditing ? (
                        <>
                          <button
                            onClick={() => updateCollab(item._id)}
                            className="px-2 py-1 rounded bg-gold text-white text-xs font-semibold"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditId(null)}
                            className="px-2 py-1 rounded border border-gray-300 text-xs"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => startEdit(item)}
                          className="px-2 py-1 rounded border border-gray-300 text-xs"
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => deleteCollab(item._id)}
                        className="p-1 text-red-600 hover:text-red-800"
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
