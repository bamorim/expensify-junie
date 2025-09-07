"use client";

import { useState } from "react";
import { api } from "~/trpc/react";
import type { Category } from "~/server/api/routers/category";
import { CreateCategoryForm } from "./create-category-form";
import { EditCategoryForm } from "./edit-category-form";
import { DeleteCategoryModal } from "./delete-category-modal";

interface CategoriesManagementProps {
  orgId: string;
  isAdmin: boolean;
}

export function CategoriesManagement({ orgId, isAdmin }: CategoriesManagementProps) {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  const { data: categories, isLoading, error, refetch } = api.category.getCategories.useQuery({ orgId });

  const handleCategoryCreated = () => {
    setShowCreateForm(false);
    void refetch();
  };

  const handleCategoryUpdated = () => {
    setEditingCategory(null);
    void refetch();
  };

  const handleCategoryDeleted = () => {
    setDeletingCategory(null);
    void refetch();
  };

  if (isLoading) {
    return (
      <div className="text-center">
        <div className="text-lg">Loading categories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        <div className="text-lg">Error loading categories</div>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Create button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Categories</h2>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
          >
            Create Category
          </button>
        )}
      </div>

      {/* Categories List */}
      {!categories || categories.length === 0 ? (
        <div className="text-center text-gray-400">
          <p>No categories found.</p>
          {isAdmin && (
            <p className="text-sm">Create your first category to get started.</p>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-lg bg-white/5 p-4 transition hover:bg-white/10"
            >
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{category.name}</h3>
                {category.description && (
                  <p className="text-sm text-gray-400">{category.description}</p>
                )}
                <p className="text-xs text-gray-500">
                  Created: {category.createdAt.toLocaleDateString()}
                </p>
              </div>
              
              {isAdmin && (
                <div className="flex gap-2">
                  <button
                    onClick={() => setEditingCategory(category)}
                    className="rounded-md bg-yellow-600 px-3 py-1 text-sm text-white transition hover:bg-yellow-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setDeletingCategory(category)}
                    className="rounded-md bg-red-600 px-3 py-1 text-sm text-white transition hover:bg-red-700"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Category Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-slate-800 p-6">
            <CreateCategoryForm
              orgId={orgId}
              onSuccess={handleCategoryCreated}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        </div>
      )}

      {/* Edit Category Form Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-md rounded-lg bg-slate-800 p-6">
            <EditCategoryForm
              category={editingCategory}
              onSuccess={handleCategoryUpdated}
              onCancel={() => setEditingCategory(null)}
            />
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deletingCategory && (
        <DeleteCategoryModal
          category={deletingCategory}
          onSuccess={handleCategoryDeleted}
          onCancel={() => setDeletingCategory(null)}
        />
      )}
    </div>
  );
}