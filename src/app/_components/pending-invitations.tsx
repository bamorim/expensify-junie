"use client";

import { api } from "~/trpc/react";

interface PendingInvitationsProps {
  orgId: string;
}

export function PendingInvitations({ orgId }: PendingInvitationsProps) {
  const { data: invitations, isLoading, error } = api.org.getPendingInvitations.useQuery({ orgId });

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white/10 p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">Pending Invitations</h2>
        <div className="text-center text-white/60">
          Loading pending invitations...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white/10 p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">Pending Invitations</h2>
        <div className="rounded-lg bg-red-500/20 p-4 text-red-200">
          Error loading invitations: {error.message}
        </div>
      </div>
    );
  }

  if (!invitations || invitations.length === 0) {
    return (
      <div className="rounded-xl bg-white/10 p-8">
        <h2 className="mb-6 text-2xl font-bold text-white">Pending Invitations</h2>
        <div className="text-center text-white/60">
          <p>No pending invitations.</p>
          <p className="mt-2 text-sm">All invitations have been accepted or have expired.</p>
        </div>
      </div>
    );
  }

  const copyInvitationLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/accept-invite?token=${token}`;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy invitation link:', err);
    }
  };

  return (
    <div className="rounded-xl bg-white/10 p-8">
      <h2 className="mb-6 text-2xl font-bold text-white">Pending Invitations</h2>
      <div className="space-y-4">
        {invitations.map((invitation) => (
          <div
            key={invitation.id}
            className="rounded-lg bg-white/10 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">
                  {invitation.email}
                </h3>
                <div className="flex items-center gap-4 text-sm text-white/60">
                  <span>
                    Invited by {invitation.inviter?.name ?? invitation.inviter?.email ?? "Unknown"}
                  </span>
                  <span>
                    {new Date(invitation.createdAt).toLocaleDateString()}
                  </span>
                  <span>
                    Expires {new Date(invitation.expiresAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => copyInvitationLink(invitation.token)}
                  className="rounded-md bg-purple-600 px-3 py-1 text-sm font-medium text-white transition hover:bg-purple-700"
                  title="Copy invitation link"
                >
                  Copy Link
                </button>
                <div className="rounded-md bg-white/10 px-3 py-1 text-sm font-medium text-white/60">
                  {invitation.token.substring(0, 8)}...
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 rounded-lg bg-blue-500/20 p-4">
        <p className="text-sm text-blue-200">
          <strong>Note:</strong> Since email sending is not configured, you&apos;ll need to manually share the invitation links with the invitees.
          They can use these links to accept the invitation and join the organization.
        </p>
      </div>
    </div>
  );
}