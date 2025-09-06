import { CreateOrganization } from "~/app/_components/create-organization";
import { AcceptInvitation } from "~/app/_components/accept-invitation";
import { OrganizationList } from "~/app/_components/organization-list";
import { auth } from "~/server/auth";
import { redirect } from "next/navigation";

export default async function OrganizationsPage() {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-[3rem]">
            Organization Management
          </h1>
          <p className="text-xl text-white/80">
            Welcome, {session.user?.name}
          </p>
        </div>

        <OrganizationList />

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="rounded-xl bg-white/10 p-8">
            <CreateOrganization />
          </div>
          
          <div className="rounded-xl bg-white/10 p-8">
            <AcceptInvitation />
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-white/60">
            Create a new organization or accept an invitation to join an existing one.
          </p>
        </div>
      </div>
    </main>
  );
}