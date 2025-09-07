import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { TRPCError } from "@trpc/server";

// Zod schemas for category validation
const createCategoryInput = z.object({
  orgId: z.string().cuid(),
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  description: z.string().optional(),
});

const updateCategoryInput = z.object({
  id: z.string().cuid(),
  name: z.string().min(1, "Category name is required").max(100, "Category name must be less than 100 characters"),
  description: z.string().optional(),
});

const deleteCategoryInput = z.object({
  id: z.string().cuid(),
});

const getCategoriesInput = z.object({
  orgId: z.string().cuid(),
});

// Category type for frontend (stubbed for now)
export type Category = {
  id: string;
  name: string;
  description: string | null;
  orgId: string;
  createdAt: Date;
  updatedAt: Date;
};

export const categoryRouter = createTRPCRouter({
  // Get all categories for an organization
  getCategories: protectedProcedure
    .input(getCategoriesInput)
    .query(async ({ ctx, input }) => {
      // Check if user is a member of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You must be a member of this organization to view categories",
        });
      }

      // Get all categories for the organization
      return await ctx.db.category.findMany({
        where: { orgId: input.orgId },
        orderBy: { name: "asc" },
      });
    }),

  // Create a new category (admin only)
  createCategory: protectedProcedure
    .input(createCategoryInput)
    .mutation(async ({ ctx, input }) => {
      // Check if user is an admin of this organization
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: input.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to create categories",
        });
      }

      // Check for duplicate category name in the same organization
      const existingCategory = await ctx.db.category.findUnique({
        where: {
          orgId_name: {
            orgId: input.orgId,
            name: input.name,
          },
        },
      });

      if (existingCategory) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "A category with this name already exists in the organization",
        });
      }

      // Create the new category
      return await ctx.db.category.create({
        data: {
          name: input.name,
          description: input.description ?? null,
          orgId: input.orgId,
        },
      });
    }),

  // Update an existing category (admin only)
  updateCategory: protectedProcedure
    .input(updateCategoryInput)
    .mutation(async ({ ctx, input }) => {
      // Find the category to update
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if user is an admin of the organization that owns this category
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: category.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to update categories",
        });
      }

      // Check for duplicate name if name is being changed
      if (input.name !== category.name) {
        const existingCategory = await ctx.db.category.findUnique({
          where: {
            orgId_name: {
              orgId: category.orgId,
              name: input.name,
            },
          },
        });

        if (existingCategory) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "A category with this name already exists in the organization",
          });
        }
      }

      // Update the category
      return await ctx.db.category.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description ?? null,
        },
      });
    }),

  // Delete a category (admin only)
  deleteCategory: protectedProcedure
    .input(deleteCategoryInput)
    .mutation(async ({ ctx, input }) => {
      // Find the category to delete
      const category = await ctx.db.category.findUnique({
        where: { id: input.id },
      });

      if (!category) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Category not found",
        });
      }

      // Check if user is an admin of the organization that owns this category
      const userMembership = await ctx.db.membership.findFirst({
        where: { orgId: category.orgId, userId: ctx.session.user.id },
      });
      
      if (!userMembership || userMembership.role !== "ADMIN") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Admin role required to delete categories",
        });
      }

      // Delete the category
      await ctx.db.category.delete({
        where: { id: input.id },
      });

      return { success: true };
    }),
});