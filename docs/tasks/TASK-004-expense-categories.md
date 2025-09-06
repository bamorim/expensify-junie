# Task Template

## Meta Information

- **Task ID**: `TASK-004`
- **Title**: Expense Categories (FR3)
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 0.5 day
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR3)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-002, TASK-003

## Description

Implement CRUD for organization-scoped expense categories (name, optional description) with admin-only access.

## Acceptance Criteria

- [ ] Admins can create/edit/delete categories
- [ ] Categories are org-scoped and isolated
- [ ] Validation for name presence and length
- [ ] Tests for API and data isolation

## TODOs

- [ ] Define tRPC category router
- [ ] Add Zod schemas for validation
- [ ] Implement Prisma queries with orgId scoping
- [ ] Write tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Define schemas.

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

N/A
