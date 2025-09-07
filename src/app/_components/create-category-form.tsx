"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface CreateCategoryFormProps {
  orgId: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateCategoryForm({ orgId, onSuccess, onCancel }: CreateCategoryFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<{ name?: string; description?: string; general?: string }>({});

  const createCategoryMutation = api.category.createCategory.useMutation({
    onSuccess: () => {
      onSuccess();
    },
    onError: (error) => {
      setErrors({ general: error.message });
    },
  });

  const validateForm = () => {
    const newErrors: { name?: string; description?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Category name is required";
    } else if (name.length > 100) {
      newErrors.name = "Category name must be less than 100 characters";
    }

    if (description && description.length > 500) {
      newErrors.description = "Description must be less than 500 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    createCategoryMutation.mutate({
      orgId,
      name: name.trim(),
      description: description.trim() || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white">Create Category</h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-gray-400 hover:text-white"
        >
          ✕
        </button>
      </div>

      {errors.general && (
        <div className="rounded-md bg-red-600/20 border border-red-600/30 p-3">
          <p className="text-sm text-red-400">{errors.general}</p>
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
          Category Name *
        </label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className={`w-full rounded-md bg-white/10 border px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Enter category name"
          maxLength={100}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-400">{errors.name}</p>
        )}
      </div>

      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className={`w-full rounded-md bg-white/10 border px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? "border-red-500" : "border-gray-600"
          }`}
          placeholder="Optional description"
          maxLength={500}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-400">{errors.description}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          {description.length}/500 characters
        </p>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={createCategoryMutation.isPending}
          className="flex-1 rounded-md bg-blue-600 px-4 py-2 text-white font-medium transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {createCategoryMutation.isPending ? "Creating..." : "Create Category"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={createCategoryMutation.isPending}
          className="flex-1 rounded-md bg-gray-600 px-4 py-2 text-white font-medium transition hover:bg-gray-700 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}