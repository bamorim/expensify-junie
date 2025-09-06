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
  getUserOrganizations: protectedProcedure
    .query(async ({ ctx }) => {
      const memberships = await ctx.db.membership.findMany({
        where: { userId: ctx.session.user.id },
        include: {
          org: true,
        },
        orderBy: { createdAt: "desc" },
      });

      return memberships.map((membership) => ({
        id: membership.org.id,
        name: membership.org.name,
        role: membership.role,
        createdAt: membership.org.createdAt,
      }));
    }),

  getOrgMembers: protectedProcedure
    .input(z.object({ orgId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user is a member of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of this organization to view members",
        });
      }

      // Get organization info and all members
      const org = await ctx.db.organization.findUnique({
        where: { id: input.orgId },
        include: {
          memberships: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
            orderBy: [
              { role: "asc" }, // ADMIN first, then MEMBER
              { createdAt: "asc" }
            ],
          },
        },
      });

      if (!org) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Organization not found",
        });
      }

      return {
        id: org.id,
        name: org.name,
        createdAt: org.createdAt,
        members: org.memberships.map((membership) => ({
          id: membership.user.id,
          name: membership.user.name,
          email: membership.user.email,
          role: membership.role,
          joinedAt: membership.createdAt,
        })),
      };
    }),

  getPendingInvitations: protectedProcedure
    .input(z.object({ orgId: z.string().cuid() }))
    .query(async ({ ctx, input }) => {
      // Check if user is an admin of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to view pending invitations",
        });
      }

      const pendingInvitations = await ctx.db.invitation.findMany({
        where: { 
          orgId: input.orgId,
          status: "PENDING",
          expiresAt: {
            gt: new Date(), // Only non-expired invitations
          },
        },
        include: {
          inviter: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      return pendingInvitations.map((invitation) => ({
        id: invitation.id,
        email: invitation.email,
        token: invitation.token,
        createdAt: invitation.createdAt,
        expiresAt: invitation.expiresAt,
        inviter: {
          id: invitation.inviter?.id,
          name: invitation.inviter?.name,
          email: invitation.inviter?.email,
        },
      }));
    }),

  create: protectedProcedure
    .input(createOrgInput)
    .mutation(async ({ ctx, input }) => {
      // Create organization and membership as ADMIN
      return await ctx.db.organization.create({
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

      // Mark the invitation as accepted and link the recipient
      await ctx.db.invitation.update({
        where: { id: invite.id },
        data: { status: "ACCEPTED", recipientId: ctx.session.user.id },
      });

      return { orgId: invite.orgId };
    }),
});
