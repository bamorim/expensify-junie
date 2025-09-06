# Task Template

## Meta Information

- **Task ID**: `TASK-010`
- **Title**: Basic Authorization (RBAC) and Org-scoped Data Isolation
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 0.5 day
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR1, FR2)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-002, TASK-003

## Description

Implement role-based access control middleware for tRPC and enforce organization-scoped queries using current membership. Ensure no data leakage across organizations.

## Acceptance Criteria

- [ ] Middleware that injects org context and checks roles
- [ ] All routers use orgId constraints
- [ ] Tests verifying isolation between orgs

## TODOs

- [ ] Implement middleware
- [ ] Update routers to require org context
- [ ] Add isolation tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Draft middleware API.

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

N/A
