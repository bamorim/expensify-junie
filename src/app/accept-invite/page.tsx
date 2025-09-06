import { auth } from "~/server/auth";
import { redirect } from "next/navigation";
import { AcceptInvitation } from "~/app/_components/accept-invitation";

interface AcceptInvitePageProps {
  searchParams: Promise<{
    token?: string;
  }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const session = await auth();
  
  if (!session) {
    redirect("/api/auth/signin");
  }

  const { token } = await searchParams;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-extrabold tracking-tight sm:text-[3rem]">
            Accept Invitation
          </h1>
          <p className="text-xl text-white/80">
            Join an organization by accepting your invitation
          </p>
        </div>

        <div className="w-full max-w-2xl">
          <div className="rounded-xl bg-white/10 p-8">
            <AcceptInvitation initialToken={token} />
          </div>
        </div>
      </div>
    </main>
  );
}