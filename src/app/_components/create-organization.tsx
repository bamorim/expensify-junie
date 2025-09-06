"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

export function CreateOrganization() {
  const [name, setName] = useState("");
  const [isSuccess, setIsSuccess] = useState(false);

  const utils = api.useUtils();
  const createOrg = api.org.create.useMutation({
    onSuccess: async () => {
      await utils.org.invalidate();
      setName("");
      setIsSuccess(true);
      // Reset success message after 3 seconds
      setTimeout(() => setIsSuccess(false), 3000);
    },
  });

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-6 text-2xl font-bold text-white">Create Organization</h2>
      
      {isSuccess && (
        <div className="mb-4 rounded-lg bg-green-500/20 p-3 text-green-200">
          Organization created successfully!
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          createOrg.mutate({ name });
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="org-name" className="mb-2 block text-sm font-medium text-white">
            Organization Name
          </label>
          <input
            id="org-name"
            type="text"
            placeholder="Enter organization name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            minLength={2}
            maxLength={100}
            required
          />
        </div>

        {createOrg.error && (
          <div className="rounded-lg bg-red-500/20 p-3 text-red-200">
            Error: {createOrg.error.message}
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          disabled={createOrg.isPending || name.length < 2}
        >
          {createOrg.isPending ? "Creating..." : "Create Organization"}
        </button>
      </form>
    </div>
  );
}