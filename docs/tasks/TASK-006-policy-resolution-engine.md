# Task Template

## Meta Information

- **Task ID**: `TASK-006`
- **Title**: Policy Resolution Engine (FR5)
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 1.5 days
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR5)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-002, TASK-005

## Description

Implement a deterministic engine to resolve the applicable policy given (orgId, userId, categoryId). Enforce precedence (user-specific > org-wide). Provide a debug output explaining resolution steps.

## Acceptance Criteria

- [ ] Policy resolution function with clear inputs/outputs
- [ ] Precedence rules implemented and tested
- [ ] Debugging output that can be surfaced in UI/CLI
- [ ] Unit tests cover edge cases (multiple policies, missing category)

## TODOs

- [ ] Implement service in server layer
- [ ] Add tests with vitest
- [ ] Add logging hooks for debugging

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Define interface and write tests first (TDD).

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

Keep engine stateless and deterministic.
