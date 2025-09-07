import { describe, it, expect, vi, beforeEach } from "vitest";
import { policyRouter } from "./policy";
import { db } from "~/server/db";
import { faker } from "@faker-js/faker";
import { Period, ReviewRoute } from "@prisma/client";

// Mock the database to use the transactional testing wrapper
vi.mock("~/server/db");

// Mock the auth module
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("PolicyRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("getPolicies", () => {
    it("should return policies for organization members", async () => {
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

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      // Create a policy
      await db.policy.create({
        data: {
          name: "Travel Policy",
          description: "Travel expense policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getPolicies({ orgId: org.id });

      expect(result).toHaveLength(1);
      expect(result[0]!.name).toEqual("Travel Policy");
      expect(result[0]!.description).toEqual("Travel expense policy");
      expect(result[0]!.maxAmount).toEqual(500);
      expect(result[0]!.period).toEqual(Period.MONTHLY);
      expect(result[0]!.reviewRoute).toEqual(ReviewRoute.AUTO_APPROVE);
      expect(result[0]!.category.name).toEqual("Travel");
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

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.getPolicies({ orgId: org.id }),
      ).rejects.toThrow("You must be a member of this organization to view policies");
    });
  });

  describe("getPolicyForCategory", () => {
    it("should return user-specific policy when it exists", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const targetUser = await db.user.create({
        data: {
          name: "Target User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: [
              { userId: user.id, role: "MEMBER" },
              { userId: targetUser.id, role: "MEMBER" },
            ],
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      // Create user-specific policy
      const userPolicy = await db.policy.create({
        data: {
          name: "User Travel Policy",
          description: "User-specific travel policy",
          orgId: org.id,
          categoryId: category.id,
          userId: targetUser.id,
          maxAmount: 1000,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.MANUAL_REVIEW,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getPolicyForCategory({
        orgId: org.id,
        categoryId: category.id,
        userId: targetUser.id,
      });

      expect(result).toBeDefined();
      expect(result!.id).toEqual(userPolicy.id);
      expect(result!.name).toEqual("User Travel Policy");
      expect(result!.userId).toEqual(targetUser.id);
      expect(result!.maxAmount).toEqual(1000);
    });

    it("should fallback to org-wide policy when user-specific doesn't exist", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const targetUser = await db.user.create({
        data: {
          name: "Target User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: [
              { userId: user.id, role: "MEMBER" },
              { userId: targetUser.id, role: "MEMBER" },
            ],
          },
        },
      });

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      // Create only org-wide policy
      const orgPolicy = await db.policy.create({
        data: {
          name: "Org Travel Policy",
          description: "Organization-wide travel policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getPolicyForCategory({
        orgId: org.id,
        categoryId: category.id,
        userId: targetUser.id,
      });

      expect(result).toBeDefined();
      expect(result!.id).toEqual(orgPolicy.id);
      expect(result!.name).toEqual("Org Travel Policy");
      expect(result!.userId).toBeNull();
      expect(result!.maxAmount).toEqual(500);
    });

    it("should return org-wide policy when no userId provided", async () => {
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

      const category = await db.category.create({
        data: {
          name: "Travel",
          orgId: org.id,
        },
      });

      const orgPolicy = await db.policy.create({
        data: {
          name: "Org Travel Policy",
          description: "Organization-wide travel policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.getPolicyForCategory({
        orgId: org.id,
        categoryId: category.id,
      });

      expect(result).toBeDefined();
      expect(result!.id).toEqual(orgPolicy.id);
      expect(result!.name).toEqual("Org Travel Policy");
      expect(result!.userId).toBeNull();
    });
  });

  describe("createPolicy", () => {
    it("should create org-wide policy for admins", async () => {
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

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.createPolicy({
        orgId: org.id,
        categoryId: category.id,
        name: "Travel Policy",
        description: "Travel expense policy",
        maxAmount: 500,
        period: Period.MONTHLY,
        reviewRoute: ReviewRoute.AUTO_APPROVE,
      });

      expect(result.name).toEqual("Travel Policy");
      expect(result.description).toEqual("Travel expense policy");
      expect(result.orgId).toEqual(org.id);
      expect(result.categoryId).toEqual(category.id);
      expect(result.userId).toBeNull();
      expect(result.maxAmount).toEqual(500);

      // Verify policy was created in database
      const policy = await db.policy.findUnique({
        where: { id: result.id },
      });
      expect(policy).toBeDefined();
      expect(policy!.name).toEqual("Travel Policy");
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

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.createPolicy({
          orgId: org.id,
          categoryId: category.id,
          name: "Travel Policy",
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        }),
      ).rejects.toThrow("Admin role required to create policies");
    });

    it("should reject duplicate policy", async () => {
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

      // Create existing policy
      await db.policy.create({
        data: {
          name: "Existing Policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 300,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.createPolicy({
          orgId: org.id,
          categoryId: category.id,
          name: "New Policy",
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        }),
      ).rejects.toThrow("A policy already exists for this category and user combination");
    });

    it("should create user-specific policy", async () => {
      const admin = await db.user.create({
        data: {
          name: "Admin User",
          email: faker.internet.email(),
        },
      });

      const targetUser = await db.user.create({
        data: {
          name: "Target User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: [
              { userId: admin.id, role: "ADMIN" },
              { userId: targetUser.id, role: "MEMBER" },
            ],
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
        user: admin,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.createPolicy({
        orgId: org.id,
        categoryId: category.id,
        userId: targetUser.id,
        name: "User Travel Policy",
        description: "User-specific travel policy",
        maxAmount: 1000,
        period: Period.MONTHLY,
        reviewRoute: ReviewRoute.MANUAL_REVIEW,
      });

      expect(result.name).toEqual("User Travel Policy");
      expect(result.userId).toEqual(targetUser.id);
      expect(result.maxAmount).toEqual(1000);
    });
  });

  describe("updatePolicy", () => {
    it("should update policy when user is admin", async () => {
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

      const policy = await db.policy.create({
        data: {
          name: "Travel Policy",
          description: "Original description",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.updatePolicy({
        id: policy.id,
        name: "Updated Travel Policy",
        description: "Updated description",
        maxAmount: 750,
        period: Period.WEEKLY,
        reviewRoute: ReviewRoute.MANUAL_REVIEW,
      });

      expect(result.name).toEqual("Updated Travel Policy");
      expect(result.description).toEqual("Updated description");
      expect(result.maxAmount).toEqual(750);
      expect(result.period).toEqual(Period.WEEKLY);
      expect(result.reviewRoute).toEqual(ReviewRoute.MANUAL_REVIEW);

      // Verify policy was updated in database
      const updatedPolicy = await db.policy.findUnique({
        where: { id: policy.id },
      });
      expect(updatedPolicy!.name).toEqual("Updated Travel Policy");
      expect(updatedPolicy!.maxAmount).toEqual(750);
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

      const policy = await db.policy.create({
        data: {
          name: "Travel Policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.updatePolicy({
          id: policy.id,
          name: "Updated Policy",
          maxAmount: 750,
          period: Period.WEEKLY,
          reviewRoute: ReviewRoute.MANUAL_REVIEW,
        }),
      ).rejects.toThrow("Admin role required to update policies");
    });

    it("should reject when policy does not exist", async () => {
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

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.updatePolicy({
          id: "clxxxxxxxxxxxxxxxxx",
          name: "Updated Policy",
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        }),
      ).rejects.toThrow("Policy not found");
    });
  });

  describe("deletePolicy", () => {
    it("should delete policy when user is admin", async () => {
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

      const policy = await db.policy.create({
        data: {
          name: "Travel Policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.deletePolicy({
        id: policy.id,
      });

      expect(result.success).toBe(true);

      // Verify policy was deleted from database
      const deletedPolicy = await db.policy.findUnique({
        where: { id: policy.id },
      });
      expect(deletedPolicy).toBeNull();
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

      const policy = await db.policy.create({
        data: {
          name: "Travel Policy",
          orgId: org.id,
          categoryId: category.id,
          maxAmount: 500,
          period: Period.MONTHLY,
          reviewRoute: ReviewRoute.AUTO_APPROVE,
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.deletePolicy({
          id: policy.id,
        }),
      ).rejects.toThrow("Admin role required to delete policies");
    });

    it("should reject when policy does not exist", async () => {
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

      const caller = policyRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.deletePolicy({
          id: "clxxxxxxxxxxxxxxxxx",
        }),
      ).rejects.toThrow("Policy not found");
    });
  });
});