"use client";

import { useState } from "react";
import { api } from "~/trpc/react";

interface InviteUserProps {
  orgId: string;
}

export function InviteUser({ orgId }: InviteUserProps) {
  const [email, setEmail] = useState("");
  const [inviteToken, setInviteToken] = useState<string | null>(null);

  const utils = api.useUtils();
  const inviteUser = api.org.invite.useMutation({
    onSuccess: async (data) => {
      await utils.org.invalidate();
      setEmail("");
      setInviteToken(data.token);
      // Clear token after 10 seconds
      setTimeout(() => setInviteToken(null), 10000);
    },
  });

  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-xl font-semibold text-white">Invite User</h3>
      
      {inviteToken && (
        <div className="mb-4 rounded-lg bg-blue-500/20 p-4 text-blue-200">
          <p className="mb-2 font-medium">Invitation sent!</p>
          <p className="text-sm">
            <strong>Invitation Token:</strong> {inviteToken}
          </p>
          <p className="mt-2 text-xs text-blue-300">
            Share this token with the user to accept the invitation. 
            In production, this would be sent via email.
          </p>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          inviteUser.mutate({ orgId, email });
        }}
        className="flex flex-col gap-3"
      >
        <div>
          <label htmlFor="invite-email" className="mb-2 block text-sm font-medium text-white">
            Email Address
          </label>
          <input
            id="invite-email"
            type="email"
            placeholder="user@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-white/10 px-4 py-2 text-white placeholder-white/60 focus:bg-white/20 focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {inviteUser.error && (
          <div className="rounded-lg bg-red-500/20 p-3 text-red-200">
            Error: {inviteUser.error.message}
          </div>
        )}

        <button
          type="submit"
          className="rounded-lg bg-purple-600 px-4 py-2 font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
          disabled={inviteUser.isPending || !email}
        >
          {inviteUser.isPending ? "Sending..." : "Send Invitation"}
        </button>
      </form>
    </div>
  );
}