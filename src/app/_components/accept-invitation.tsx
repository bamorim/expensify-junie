"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface AcceptInvitationProps {
  initialToken?: string;
}

export function AcceptInvitation({ initialToken }: AcceptInvitationProps) {
  const [token, setToken] = useState(initialToken ?? "");
  const [isSuccess, setIsSuccess] = useState(false);

  const utils = api.useUtils();
  const acceptInvite = api.org.acceptInvite.useMutation({
    onSuccess: async () => {
      await utils.org.invalidate();
      setToken("");
      setIsSuccess(true);
      // Reset success message after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    },
  });

  return (
    <div className="w-full max-w-md">
      <h2 className="mb-6 text-2xl font-bold text-white">Accept Invitation</h2>
      
      {isSuccess && (
        <div className="mb-4 rounded-lg bg-green-500/20 p-3 text-green-200">
          Successfully joined organization!
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          acceptInvite.mutate({ token });
        }}
        className="flex flex-col gap-4"
      >
        <div>
          <label htmlFor="invite-token" className="mb-2 block text-sm font-medium text-white">
            Invitation Token
          </label>
          <input
            id="invite-token"
            type="text"
            placeholder="Enter invitation token"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-3 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            minLength={10}
            required
          />
          <p className="mt-1 text-xs text-white/60">
            Enter the invitation token you received to join the organization.
          </p>
        </div>

        {acceptInvite.error && (
          <div className="rounded-lg bg-red-500/20 p-3 text-red-200">
            Error: {acceptInvite.error.message}
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-6 py-3 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          disabled={acceptInvite.isPending || token.length < 10}
        >
          {acceptInvite.isPending ? "Accepting..." : "Accept Invitation"}
        </button>
      </form>
    </div>
  );
}