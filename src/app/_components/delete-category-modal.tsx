"use client";

import { api } from "~/trpc/react";
import type { Category } from "~/server/api/routers/category";

interface DeleteCategoryModalProps {
  category: Category;
  onSuccess: () => void;
  onCancel: () => void;
}

export function DeleteCategoryModal({ category, onSuccess, onCancel }: DeleteCategoryModalProps) {
  const deleteCategoryMutation = api.category.deleteCategory.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      alert(`Error deleting category: ${error.message}`);
    },
  });

  const handleDelete = () => {
    deleteCategoryMutation.mutate({ id: category.id });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-slate-800 p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold text-white">Delete Category</h3>
            <button
              type="button"
              onClick={onCancel}
              className="text-gray-400 hover:text-white"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            <div className="rounded-md bg-red-600/20 border border-red-600/30 p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-red-400"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-400">Warning</h4>
                  <p className="text-sm text-red-300 mt-1">
                    This action cannot be undone. This will permanently delete the category.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 rounded-lg p-4">
              <h4 className="font-medium text-white mb-2">Category Details:</h4>
              <p className="text-gray-300">
                <strong>Name:</strong> {category.name}
              </p>
              {category.description && (
                <p className="text-gray-300 mt-1">
                  <strong>Description:</strong> {category.description}
                </p>
              )}
            </div>

            <p className="text-sm text-gray-400">
              Are you sure you want to delete this category? This action cannot be undone.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              onClick={handleDelete}
              disabled={deleteCategoryMutation.isPending}
              className="flex-1 rounded-md bg-red-600 px-4 py-2 text-white font-medium transition hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {deleteCategoryMutation.isPending ? "Deleting..." : "Delete Category"}
            </button>
            <button
              onClick={onCancel}
              disabled={deleteCategoryMutation.isPending}
              className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-white font-medium transition hover:bg-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}