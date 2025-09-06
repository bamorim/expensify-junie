import { describe, it, expect, vi, beforeEach } from "vitest";
import { orgRouter } from "./org";
import { db } from "~/server/db";
import { faker } from "@faker-js/faker";

// Mock the database to use the transactional testing wrapper
vi.mock("~/server/db");

// Mock the auth module
vi.mock("~/server/auth", () => ({
  auth: vi.fn(),
}));

describe("OrgRouter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("create", () => {
    it("should create an organization with the creator as admin", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.create({ name: "Test Organization" });

      expect(result.name).toEqual("Test Organization");
      expect(result.id).toBeDefined();

      // Verify organization was created
      const org = await db.organization.findUnique({
        where: { id: result.id },
        include: { memberships: true },
      });

      expect(org).toBeDefined();
      expect(org!.memberships).toHaveLength(1);
      expect(org!.memberships[0]!.userId).toEqual(user.id);
      expect(org!.memberships[0]!.role).toEqual("ADMIN");
    });

    it("should validate organization name length", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      // Test too short name
      await expect(caller.create({ name: "A" })).rejects.toThrow();

      // Test too long name
      const longName = "A".repeat(101);
      await expect(caller.create({ name: longName })).rejects.toThrow();
    });
  });

  describe("invite", () => {
    it("should create an invitation when user is admin", async () => {
      // Create user and organization
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

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const inviteEmail = faker.internet.email();
      const result = await caller.invite({
        orgId: org.id,
        email: inviteEmail,
      });

      expect(result.id).toBeDefined();
      expect(result.token).toBeDefined();

      // Verify invitation was created
      const invitation = await db.invitation.findUnique({
        where: { id: result.id },
      });

      expect(invitation).toBeDefined();
      expect(invitation!.email).toEqual(inviteEmail);
      expect(invitation!.orgId).toEqual(org.id);
      expect(invitation!.inviterId).toEqual(user.id);
      expect(invitation!.status).toEqual("PENDING");
      expect(invitation!.expiresAt).toBeInstanceOf(Date);
    });

    it("should reject invitation when user is not admin", async () => {
      // Create user with MEMBER role
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

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.invite({
          orgId: org.id,
          email: faker.internet.email(),
        }),
      ).rejects.toThrow("Admin role required");
    });

    it("should reject invitation when user is not a member of the organization", async () => {
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

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.invite({
          orgId: org.id,
          email: faker.internet.email(),
        }),
      ).rejects.toThrow("Admin role required");
    });
  });

  describe("acceptInvite", () => {
    it("should accept valid invitation and create membership", async () => {
      // Create inviting user and organization
      const inviter = await db.user.create({
        data: {
          name: "Inviter User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: inviter.id,
              role: "ADMIN",
            },
          },
        },
      });

      // Create invitee user
      const invitee = await db.user.create({
        data: {
          name: "Invitee User",
          email: faker.internet.email(),
        },
      });

      // Create invitation
      const invitation = await db.invitation.create({
        data: {
          orgId: org.id,
          email: invitee.email!,
          token: crypto.randomUUID(),
          inviterId: inviter.id,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        },
      });

      const mockSession = {
        user: invitee,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.acceptInvite({ token: invitation.token });

      expect(result.orgId).toEqual(org.id);

      // Verify membership was created
      const membership = await db.membership.findUnique({
        where: {
          userId_orgId: {
            userId: invitee.id,
            orgId: org.id,
          },
        },
      });

      expect(membership).toBeDefined();
      expect(membership!.role).toEqual("MEMBER");

      // Verify invitation was updated
      const updatedInvitation = await db.invitation.findUnique({
        where: { id: invitation.id },
      });

      expect(updatedInvitation!.status).toEqual("ACCEPTED");
      expect(updatedInvitation!.recipientId).toEqual(invitee.id);
    });

    it("should reject invalid token", async () => {
      const user = await db.user.create({
        data: {
          name: "Test User",
          email: faker.internet.email(),
        },
      });

      const mockSession = {
        user,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.acceptInvite({ token: "invalid-token" }),
      ).rejects.toThrow("Invalid token");
    });

    it("should reject expired invitation", async () => {
      // Create inviting user and organization
      const inviter = await db.user.create({
        data: {
          name: "Inviter User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: inviter.id,
              role: "ADMIN",
            },
          },
        },
      });

      // Create invitee user
      const invitee = await db.user.create({
        data: {
          name: "Invitee User",
          email: faker.internet.email(),
        },
      });

      // Create an expired invitation
      const invitation = await db.invitation.create({
        data: {
          orgId: org.id,
          email: invitee.email!,
          token: crypto.randomUUID(),
          inviterId: inviter.id,
          expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
        },
      });

      const mockSession = {
        user: invitee,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      await expect(
        caller.acceptInvite({ token: invitation.token }),
      ).rejects.toThrow("Token expired");
    });

    it("should handle existing membership (upsert)", async () => {
      // Create inviting user and organization
      const inviter = await db.user.create({
        data: {
          name: "Inviter User",
          email: faker.internet.email(),
        },
      });

      const org = await db.organization.create({
        data: {
          name: "Test Org",
          memberships: {
            create: {
              userId: inviter.id,
              role: "ADMIN",
            },
          },
        },
      });

      // Create invitee user with existing membership
      const invitee = await db.user.create({
        data: {
          name: "Invitee User",
          email: faker.internet.email(),
        },
      });

      // Create existing membership
      await db.membership.create({
        data: {
          userId: invitee.id,
          orgId: org.id,
          role: "MEMBER",
        },
      });

      // Create invitation
      const invitation = await db.invitation.create({
        data: {
          orgId: org.id,
          email: invitee.email!,
          token: crypto.randomUUID(),
          inviterId: inviter.id,
          expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000),
        },
      });

      const mockSession = {
        user: invitee,
        expires: "2030-12-31T23:59:59.999Z",
      };

      const caller = orgRouter.createCaller({
        db: db,
        session: mockSession,
        headers: new Headers(),
      });

      const result = await caller.acceptInvite({ token: invitation.token });

      expect(result.orgId).toEqual(org.id);

      // Verify membership still exists and wasn't duplicated
      const memberships = await db.membership.findMany({
        where: {
          userId: invitee.id,
          orgId: org.id,
        },
      });

      expect(memberships).toHaveLength(1);
      expect(memberships[0]!.role).toEqual("MEMBER");
    });
  });
});