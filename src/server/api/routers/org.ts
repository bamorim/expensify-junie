import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

const createOrgInput = z.object({ name: z.string().min(2).max(100) });
const inviteInput = z.object({
  orgId: z.string().cuid(),
  email: z.string().email(),
});
const acceptInviteInput = z.object({ token: z.string().min(10) });

export const orgRouter = createTRPCRouter({
  create: protectedProcedure
    .input(createOrgInput)
    .mutation(async ({ ctx, input }) => {
      // Create organization and membership as ADMIN
      const org = await ctx.db.organization.create({
        data: {
          name: input.name,
          memberships: {
            create: {
              userId: ctx.session.user.id,
              role: "ADMIN",
            },
          },
        },
      });
      return org;
    }),

  invite: protectedProcedure
    .input(inviteInput)
    .mutation(async ({ ctx, input }) => {
      // Ensure inviter is ADMIN in org
      const membership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      if (!membership || membership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required",
        });
      }
      // Create invitation with token and expiry (72h)
      const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);
      const token = crypto.randomUUID();
      const invitation = await ctx.db.invitation.create({
        data: {
          orgId: input.orgId,
          email: input.email,
          token,
          inviterId: ctx.session.user.id,
          expiresAt,
        },
      });
      // Stub: In real impl, send email. Here we just return the token for dev.
      return { id: invitation.id, token: invitation.token };
    }),

  acceptInvite: protectedProcedure
    .input(acceptInviteInput)
    .mutation(async ({ ctx, input }) => {
      const invite = await ctx.db.invitation.findUnique({
        where: { token: input.token },
      });
      if (!invite)
        throw new TRPCError({ code: "NOT_FOUND", message: "Invalid token" });
      if (invite.expiresAt < new Date())
        throw new TRPCError({ code: "BAD_REQUEST", message: "Token expired" });

      // Upsert membership as MEMBER
      await ctx.db.membership.upsert({
        where: {
          userId_orgId: { userId: ctx.session.user.id, orgId: invite.orgId },
        },
        create: {
          userId: ctx.session.user.id,
          orgId: invite.orgId,
          role: "MEMBER",
        },
        update: {},
      });

      // Mark invitation as accepted and link recipient
      await ctx.db.invitation.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", recipientId: ctx.session.user.id },
      });

      return { orgId: invite.orgId };
    }),
});
