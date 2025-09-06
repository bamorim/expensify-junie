# Architecture Overview

This document provides a high-level architecture for the Expense Reimbursement System, aligned with the PRD (docs/product/prd-main.md) and the T3 stack.

## Stack
- Framework: Next.js (App Router) with TypeScript
- API: tRPC for server procedures with Zod validation
- ORM: Prisma with PostgreSQL
- Auth: Magic code email-based placeholder (NextAuth-compatible structure for later)
- Styling: Tailwind CSS
- Testing: Vitest (unit + integration) with transactional Prisma testing
- Code Quality: ESLint + Prettier

## Core Domain Modules
- User & Organization Management (FR1, FR2)
- Expense Categories (FR3)
- Policy Management (FR4)
- Policy Resolution Engine (FR5)
- Expense Submission (FR6)
- Review Workflow (FR7)
- Audit Trail (Technical Considerations)

## Multi-tenancy & Data Isolation
- Organization-scoped models include orgId foreign key.
- Membership table links userId, orgId, role (Admin|Member).
- All queries must filter by orgId derived from the active membership in request context.

## Policy Precedence
- Two policy scopes: org-wide and user-specific.
- Resolution engine picks user-specific over org-wide when both exist for a given (categoryId, userId) in the same org.
- Engine exposes debug traces for transparency.

## API Layer
- tRPC routers organized by domain (org, categories, policies, expenses, reviews).
- Middleware: authentication, org-context injection, RBAC enforcement.

## Data Model (Initial)
- User(id, email, name, ...)
- Organization(id, name)
- Membership(id, userId, orgId, role)
- Category(id, orgId, name, description?)
- Policy(id, orgId, categoryId, maxAmountCents, period, routing, userId?)
- Expense(id, orgId, userId, categoryId, date, amountCents, description, status)
- Review(id, orgId, expenseId, reviewerId, action, comment?)
- AuditLog(id, orgId, entityType, entityId, action, actorId, meta, createdAt)

## Statuses
- Expense: submitted | approved | rejected
- Review action: approved | rejected

## Security Considerations
- Magic email code based authentication (placeholder) with session.
- RBAC: Admin (policy/category/org management), Member (submit expenses).
- Strict org data isolation at the API and DB levels.

## Testing Strategy
- Unit tests for business logic (policy resolution).
- Integration tests for tRPC procedures using createCaller and transactional DB.

## Performance & Accessibility
- Target <2s page loads.
- WCAG 2.1 AA compliance for UI components.

## Future Work
- Replace placeholder auth/email with production-grade solutions.
- Extend policies (rolling limits, groups) and attachments/OCR (out-of-scope for v1).
