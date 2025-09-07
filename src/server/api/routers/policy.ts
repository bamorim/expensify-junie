import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";
import { Period, ReviewRoute } from "@prisma/client";

// Zod schemas for policy validation
const createPolicyInput = z.object({
  orgId: z.string().cuid(),
  categoryId: z.string().cuid(),
  userId: z.string().cuid().optional(), // Optional for org-wide policies
  name: z.string().min(1, "Policy name is required").max(100, "Policy name must be less than 100 characters"),
  description: z.string().optional(),
  maxAmount: z.number().positive("Maximum amount must be positive"),
  period: z.nativeEnum(Period),
  reviewRoute: z.nativeEnum(ReviewRoute),
});

const updatePolicyInput = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Policy name is required").max(100, "Policy name must be less than 100 characters"),
  description: z.string().optional(),
  maxAmount: z.number().positive("Maximum amount must be positive"),
  period: z.nativeEnum(Period),
  reviewRoute: z.nativeEnum(ReviewRoute),
});

const deletePolicyInput = z.object({
  id: z.string().cuid(),
});

const getPoliciesInput = z.object({
  orgId: z.string().cuid(),
});

const getPolicyForCategoryInput = z.object({
  orgId: z.string().cuid(),
  categoryId: z.string().cuid(),
  userId: z.string().cuid().optional(), // If provided, will look for user-specific policy first
});

// Policy type for frontend
export type Policy = {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  categoryId: string;
  userId: string | null;
  maxAmount: number;
  period: Period;
  reviewRoute: ReviewRoute;
  createdAt: Date;
  updatedAt: Date;
};

export const policyRouter = createTRPCRouter({
  // Get all policies for an organization
  getPolicies: protectedProcedure
    .input(getPoliciesInput)
    .query(async ({ ctx, input }) => {
      // Check if user is a member of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of this organization to view policies",
        });
      }

      // Get all policies for the organization
      return await ctx.db.policy.findMany({
        where: { orgId: input.orgId },
        include: {
          category: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
        orderBy: { name: "asc" },
      });
    }),

  // Get applicable policy for a specific category/user combination (policy resolution)
  getPolicyForCategory: protectedProcedure
    .input(getPolicyForCategoryInput)
    .query(async ({ ctx, input }) => {
      // Check if user is a member of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of this organization to view policies",
        });
      }

      // Policy precedence: user-specific > organization-wide
      // First, try to find user-specific policy
      if (input.userId) {
        const userSpecificPolicy = await ctx.db.policy.findUnique({
          where: {
            orgId_categoryId_userId: {
              orgId: input.orgId,
              categoryId: input.categoryId,
              userId: input.userId,
            },
          },
          include: {
            category: { select: { name: true } },
            user: { select: { name: true, email: true } },
          },
        });

        if (userSpecificPolicy) {
          return userSpecificPolicy;
        }
      }

      // If no user-specific policy found, look for organization-wide policy
      return await ctx.db.policy.findFirst({
        where: {
          orgId: input.orgId,
          categoryId: input.categoryId,
          userId: null, // Organization-wide policies have null userId
        },
        include: {
          category: { select: { name: true } },
          user: { select: { name: true, email: true } },
        },
      });
    }),

  // Create a new policy (admin only)
  createPolicy: protectedProcedure
    .input(createPolicyInput)
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to create policies",
        });
      }

      // Verify category belongs to the same organization
      const category = await ctx.db.category.findFirst({
        where: { id: input.categoryId, orgId: input.orgId },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found in this organization",
        });
      }

      // If userId provided, verify user is a member of the organization
      if (input.userId) {
        const targetUserMembership = await ctx.db.membership.findFirst({
          where: { orgId: input.orgId, userId: input.userId },
        });

        if (!targetUserMembership) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "User not found in this organization",
          });
        }
      }

      // Check for existing policy (org/category/user combination must be unique)
      const existingPolicy = await ctx.db.policy.findFirst({
        where: {
          orgId: input.orgId,
          categoryId: input.categoryId,
          userId: input.userId ?? null,
        },
      });

      if (existingPolicy) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A policy already exists for this category and user combination",
        });
      }

      // Create the new policy
      return await ctx.db.policy.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          orgId: input.orgId,
          categoryId: input.categoryId,
          userId: input.userId ?? null,
          maxAmount: input.maxAmount,
          period: input.period,
          reviewRoute: input.reviewRoute,
        },
      });
    }),

  // Update an existing policy (admin only)
  updatePolicy: protectedProcedure
    .input(updatePolicyInput)
    .mutation(async ({ ctx, input }) => {
      // Find the policy to update
      const policy = await ctx.db.policy.findUnique({
        where: { id: input.id },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy not found",
        });
      }

      // Check if user is an admin of the organization that owns this policy
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: policy.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to update policies",
        });
      }

      // Update the policy
      return await ctx.db.policy.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? null,
          maxAmount: input.maxAmount,
          period: input.period,
          reviewRoute: input.reviewRoute,
        },
      });
    }),

  // Delete a policy (admin only)
  deletePolicy: protectedProcedure
    .input(deletePolicyInput)
    .mutation(async ({ ctx, input }) => {
      // Find the policy to delete
      const policy = await ctx.db.policy.findUnique({
        where: { id: input.id },
      });

      if (!policy) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Policy not found",
        });
      }

      // Check if user is an admin of the organization that owns this policy
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: policy.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to delete policies",
        });
      }

      // Delete the policy
      await ctx.db.policy.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});