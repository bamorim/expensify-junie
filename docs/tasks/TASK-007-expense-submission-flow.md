# Task Template

## Meta Information

- **Task ID**: `TASK-007`
- **Title**: Expense Submission Flow (FR6)
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 1 day
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR6)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-002, TASK-004, TASK-006

## Description

Implement expense creation with date, amount, category, description. Apply policy rules: auto-reject over-limit; under-limit goes auto-approve or manual review based on policy.

## Acceptance Criteria

- [ ] API to submit expense with validation
- [ ] Applies policy resolution and enforces limits
- [ ] Sets status: submitted → approved/rejected based on policy
- [ ] Tests for limits and routing behavior

## TODOs

- [ ] Zod input schemas
- [ ] Use policy engine
- [ ] Implement persistence and status transitions
- [ ] Tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Define input/output and tests.

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

Ensure monetary amounts use integer cents to avoid floating errors.
