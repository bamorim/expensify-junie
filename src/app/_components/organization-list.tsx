"use client";

import Link from "next/link";
import { api } from "~/trpc/react";

export function OrganizationList() {
  const { data: organizations, isLoading, error } = api.org.getUserOrganizations.useQuery();

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Your Organizations</h2>
        <div className="rounded-lg bg-white/10 p-6 text-center text-white/60">
          Loading organizations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Your Organizations</h2>
        <div className="rounded-lg bg-red-500/20 p-6 text-red-200">
          Error loading organizations: {error.message}
        </div>
      </div>
    );
  }

  if (!organizations || organizations.length === 0) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="mb-6 text-2xl font-bold text-white">Your Organizations</h2>
        <div className="rounded-lg bg-white/10 p-6 text-center text-white/60">
          <p className="mb-2">You don&apos;t belong to any organizations yet.</p>
          <p className="text-sm">Create a new organization or accept an invitation to get started.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="mb-6 text-2xl font-bold text-white">Your Organizations</h2>
      <div className="space-y-3">
        {organizations.map((org) => (
          <div
            key={org.id}
            className="flex items-center justify-between rounded-lg bg-white/10 p-4 transition hover:bg-white/20"
          >
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">{org.name}</h3>
              <div className="flex items-center gap-4 text-sm text-white/60">
                <span
                  className={`inline-block rounded-full px-2 py-1 text-xs font-medium ${
                    org.role === "ADMIN"
                      ? "bg-purple-500/20 text-purple-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {org.role}
                </span>
                <span>
                  Joined {new Date(org.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                href={`/organizations/${org.id}`}
                className="rounded-md bg-purple-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-purple-700"
              >
                View
              </Link>
              {org.role === "ADMIN" && (
                <Link
                  href={`/organizations/${org.id}/admin`}
                  className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white transition hover:bg-white/20"
                >
                  Admin
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}