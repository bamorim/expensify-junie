# Task Template

## Meta Information

- **Task ID**: `TASK-008`
- **Title**: Review Workflow (FR7)
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 1 day
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR7)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-002, TASK-006, TASK-007

## Description

Implement reviewer queue and actions to approve/reject with optional comments. Track status transitions submitted → approved/rejected and who performed the action.

## Acceptance Criteria

- [ ] API to list assigned expenses for review
- [ ] Approve/reject endpoints with comments
- [ ] Proper status transitions persisted with actor
- [ ] Tests for workflow paths

## TODOs

- [ ] tRPC procedures for reviewer queue and actions
- [ ] Zod validation
- [ ] Audit entries for actions
- [ ] Tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Define reviewer assignment rules (simple round-robin or admin list).

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

Keep assignment simple in v1; can expand later.
