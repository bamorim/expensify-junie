import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { api } from "~/trpc/server";

interface OrganizationPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function OrganizationPage({ params }: OrganizationPageProps) {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { orgId } = await params;

  try {
    const orgData = await api.org.getOrgMembers({ orgId });

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-8 px-4 py-16">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-[3rem]">
              {orgData.name}
            </h1>
            <p className="text-xl text-white/80">
              Organization Members ({orgData.members.length})
            </p>
          </div>

          <div className="w-full max-w-4xl">
            <div className="rounded-xl bg-white/10 p-8">
              <h2 className="mb-6 text-2xl font-bold text-white">Members</h2>
              
              {orgData.members.length === 0 ? (
                <div className="text-center text-white/60 py-8">
                  <p>No members found in this organization.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {orgData.members.map((member) => (
                    <div
                      key={member.id}
                      className="flex items-center justify-between rounded-lg bg-white/10 p-4"
                    >
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {member.name ?? "Unknown User"}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-white/60">
                          <span>{member.email}</span>
                          <span>
                            Joined {new Date(member.joinedAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${
                            member.role === "ADMIN"
                              ? "bg-purple-500/20 text-purple-300"
                              : "bg-blue-500/20 text-blue-300"
                          }`}
                        >
                          {member.role}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-4 flex-wrap justify-center">
            <Link
              href="/organizations"
              className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              ← Back to Organizations
            </Link>
            
            <Link
              href={`/organizations/${orgId}/categories`}
              className="rounded-full bg-green-600 px-6 py-3 font-semibold no-underline transition hover:bg-green-700"
            >
              View Categories
            </Link>
            
            {/* Check if current user is admin to show admin link */}
            {orgData.members.find(m => m.id === session.user.id)?.role === "ADMIN" && (
              <Link
                href={`/organizations/${orgId}/admin`}
                className="rounded-full bg-purple-600 px-6 py-3 font-semibold no-underline transition hover:bg-purple-700"
              >
                Admin Dashboard →
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  } catch {
    // If user doesn't have access or org doesn't exist, redirect
    redirect("/organizations");
  }
}