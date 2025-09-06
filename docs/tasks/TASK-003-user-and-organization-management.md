# Task Template

## Meta Information

- **Task ID**: `TASK-003`
- **Title**: User & Organization Management (FR1, FR2)
- **Status**: `In Progress`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 2 days
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR1, FR2)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-001, TASK-002

## Description

Implement organization creation, invitations (email stub), role-based access (Admin, Member), and membership acceptance. Use magic email code placeholder for auth per PRD scope. Ensure org-scoped data isolation.

## Acceptance Criteria

- [x] Users can create organizations; creator becomes Admin
- [x] Admins can invite users via email (stubbed delivery)
- [x] Users can accept invites and join orgs
- [x] Roles enforced in API layer
- [x] Tests cover membership flows and org-scoping

## TODOs

- [x] Define tRPC procedures for org create, invite, accept
- [x] Add role checks with middleware
- [x] Create invite token model and flow
- [x] Mock email sender
- [x] Write unit/integration tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: In Progress
**Progress**: Added org router (create, invite, acceptInvite) and extended Prisma schema for Organization, Membership, Invitation. Wired router to appRouter.
**Blockers**: Need to run migration and add tests.
**Next Steps**: Create migration and write basic tests for org flows.

### 2025-09-07 - Junie
**Status**: Complete
**Progress**: Database migration applied successfully. Created comprehensive test suite with proper auth mocking for org router covering all flows: create org, invite users, and accept invitations.
**Blockers**: None
**Next Steps**: Task complete. Ready for code review.

## Completion Checklist

- [x] All acceptance criteria met
- [x] Code follows project standards
- [x] Tests written and passing
- [x] Documentation updated (if needed)
- [ ] Code review completed

## Notes

Replace stubbed auth/email with real services in future milestones.
