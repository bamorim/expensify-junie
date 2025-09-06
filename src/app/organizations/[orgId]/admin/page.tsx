import { InviteUser } from "~/app/_components/invite-user";
import { PendingInvitations } from "~/app/_components/pending-invitations";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import Link from "next/link";

interface AdminPageProps {
  params: {
    orgId: string;
  };
}

export default async function AdminPage({ params }: AdminPageProps) {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Check if user is admin in this organization
  try {
    const membership = await db.membership.findFirst({
      where: { orgId: params.orgId, userId: session.user.id },
    });

    if (!membership || membership.role !== "ADMIN") {
      redirect("/organizations");
    }

    const org = await db.organization.findUnique({
      where: { id: params.orgId },
    });

    if (!org) {
      redirect("/organizations");
    }

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-[3rem]">
              Admin Dashboard
            </h1>
            <p className="text-xl text-white/80">
              Managing: {org.name}
            </p>
          </div>

          <div className="w-full max-w-4xl space-y-8">
            <div className="rounded-xl bg-white/10 p-8">
              <InviteUser orgId={params.orgId} />
            </div>
            
            <PendingInvitations orgId={params.orgId} />
          </div>

          <div className="text-center">
            <Link 
              href="/organizations"
              className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              ← Back to Organizations
            </Link>
          </div>
        </div>
      </main>
    );
  } catch {
    redirect("/organizations");
  }
}