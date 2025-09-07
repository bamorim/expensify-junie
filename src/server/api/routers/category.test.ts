import { describe, it, expect, vi, beforeEach } from "vitest";
import { categoryRouter } from "./category";
import { db } from "~/server/db";
import { faker } from "@faker-js/faker";

// Mock the database to use the transactional testing wrapper
vi.mock("~/server/db");

// Mock the auth module
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("CategoryRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getCategories", () => {
    it("should return categories for organization members", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "MEMBER",
            },
          },
        },
      });

      // Create some categories
      await db.category.create({
        data: {
          name: "Travel",
          description: "Travel expenses",
          orgId: org.id,
        },
      });

      await db.category.create({
        data: {
          name: "Meals",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getCategories({ orgId: org.id });

      expect(result).toHaveLength(2);
      expect(result[0]!.name).toEqual("Meals"); // Ordered by name
      expect(result[1]!.name).toEqual("Travel");
      expect(result[1]!.description).toEqual("Travel expenses");
    });

    it("should reject non-members", async () => {
      const user = await db.user.create({
        data: {
          name: "Non-member User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.getCategories({ orgId: org.id }),
      ).rejects.toThrow("You must be a member of this organization to view categories");
    });
  });

  describe("createCategory", () => {
    it("should create category when user is admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.createCategory({
        orgId: org.id,
        name: "Office Supplies",
        description: "Various office supplies",
      });

      expect(result.name).toEqual("Office Supplies");
      expect(result.description).toEqual("Various office supplies");
      expect(result.orgId).toEqual(org.id);

      // Verify category was created in database
      const category = await db.category.findUnique({
        where: { id: result.id },
      });

      expect(category).toBeDefined();
      expect(category!.name).toEqual("Office Supplies");
    });

    it("should reject when user is not admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "MEMBER",
            },
          },
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.createCategory({
          orgId: org.id,
          name: "Office Supplies",
        }),
      ).rejects.toThrow("Admin role required to create categories");
    });

    it("should reject duplicate category names in same org", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      // Create existing category
      await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.createCategory({
          orgId: org.id,
          name: "Travel",
        }),
      ).rejects.toThrow("A category with this name already exists in the organization");
    });
  });

  describe("updateCategory", () => {
    it("should update category when user is admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          description: "Old description",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.updateCategory({
        id: category.id,
        name: "Business Travel",
        description: "Updated description",
      });

      expect(result.name).toEqual("Business Travel");
      expect(result.description).toEqual("Updated description");

      // Verify category was updated in database
      const updatedCategory = await db.category.findUnique({
        where: { id: category.id },
      });

      expect(updatedCategory!.name).toEqual("Business Travel");
      expect(updatedCategory!.description).toEqual("Updated description");
    });

    it("should reject when user is not admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "MEMBER",
            },
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.updateCategory({
          id: category.id,
          name: "Business Travel",
        }),
      ).rejects.toThrow("Admin role required to update categories");
    });

    it("should reject when category does not exist", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.updateCategory({
          id: "clxxxxxxxxxxxxxxxxx",
          name: "Business Travel",
        }),
      ).rejects.toThrow("Category not found");
    });
  });

  describe("deleteCategory", () => {
    it("should delete category when user is admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.deleteCategory({
        id: category.id,
      });

      expect(result.success).toBe(true);

      // Verify category was deleted from database
      const deletedCategory = await db.category.findUnique({
        where: { id: category.id },
      });

      expect(deletedCategory).toBeNull();
    });

    it("should reject when user is not admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Member User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "MEMBER",
            },
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.deleteCategory({
          id: category.id,
        }),
      ).rejects.toThrow("Admin role required to delete categories");
    });

    it("should reject when category does not exist", async () => {
      const user = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: user.id,
              role: "ADMIN",
            },
          },
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = categoryRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.deleteCategory({
          id: "clxxxxxxxxxxxxxxxxx",
        }),
      ).rejects.toThrow("Category not found");
    });
  });
});