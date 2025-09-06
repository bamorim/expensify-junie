# Task Template

## Meta Information

- **Task ID**: `TASK-012`
- **Title**: Policy Debugging Tool (Transparency)
- **Status**: `Not Started`
- **Priority**: `P0`
- **Created**: 2025-09-06
- **Updated**: 2025-09-06
- **Estimated Effort**: 0.5 day
- **Actual Effort**: -

## Related Documents

- **PRD**: docs/product/prd-main.md (FR5)
- **ADR**: docs/technical/decisions/
- **Dependencies**: TASK-006

## Description

Provide an endpoint or UI that, given orgId/userId/categoryId, returns the resolved policy plus a step-by-step explanation of the resolution and why other policies were excluded.

## Acceptance Criteria

- [ ] API endpoint that returns resolution result and explanation
- [ ] Covers edge cases (no applicable policy, conflicts)
- [ ] Tests for explanation clarity

## TODOs

- [ ] Extend policy engine to produce explanation artifacts
- [ ] Add tRPC procedure to expose debugging data
- [ ] Write tests

## Progress Updates

### 2025-09-06 - Junie
**Status**: Not Started
**Progress**: Task created.
**Blockers**: None
**Next Steps**: Define explanation schema.

## Completion Checklist

- [ ] All acceptance criteria met
- [ ] Code follows project standards
- [ ] Tests written and passing
- [ ] Documentation updated (if needed)
- [ ] Code review completed

## Notes

This supports mitigation for policy conflicts risk in PRD.
