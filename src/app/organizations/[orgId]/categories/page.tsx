import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { db } from "~/server/db";
import Link from "next/link";
import { CategoriesManagement } from "~/app/_components/categories-management";

interface CategoriesPageProps {
  params: Promise<{
    orgId: string;
  }>;
}

export default async function CategoriesPage({ params }: CategoriesPageProps) {
  const { orgId } = await params;
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  // Check if user is a member of this organization
  try {
    const membership = await db.membership.findFirst({
      where: { orgId: orgId, userId: session.user.id },
    });

    if (!membership) {
      redirect("/organizations");
    }

    const org = await db.organization.findUnique({
      where: { id: orgId },
    });

    if (!org) {
      redirect("/organizations");
    }

    const isAdmin = membership.role === "ADMIN";

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
          <div className="text-center">
            <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-[3rem]">
              Expense Categories
            </h1>
            <p className="text-xl text-white/80">
              Managing categories for: {org.name}
            </p>
          </div>

          <div className="w-full max-w-4xl space-y-8">
            <div className="rounded-xl bg-white/10 p-8">
              <CategoriesManagement orgId={orgId} isAdmin={isAdmin} />
            </div>
          </div>

          <div className="flex gap-4">
            <Link 
              href={`/organizations/${orgId}`}
              className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
            >
              ← Back to Organization
            </Link>
            {isAdmin && (
              <Link 
                href={`/organizations/${orgId}/admin`}
                className="rounded-full bg-white/10 px-6 py-3 font-semibold no-underline transition hover:bg-white/20"
              >
                Admin Dashboard
              </Link>
            )}
          </div>
        </div>
      </main>
    );
  } catch {
    redirect("/organizations");
  }
}