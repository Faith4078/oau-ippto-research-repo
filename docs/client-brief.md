University Research Repository and Innovation Visibility System

System Requirements Specification

1. Project Overview

Develop a modern web-based University Research Repository and InnovationVisibility System that serves as the central platform for managing,preserving, and showcasing the university's research outputs,innovations, patents, commercialization activities, and intellectualproperty managed by the Intellectual Property and Technology TransferOffice (IPTTO).

The system must provide a searchable public repository while offeringsecure administrative dashboards for lecturers, departmentadministrators, IPTTO staff, and system administrators.

2. Objectives

Centralize institutional research.

Increase research visibility.

Improve discoverability through SEO, AEO, and GEO.

Support research approval workflows.

Manage innovations and patents.

Generate reports and analytics.

Provide secure file storage and access control.

Be maintainable, scalable, and cost-efficient.

3. Recommended Technology Stack

Framework: TanStack Start

Routing: TanStack Router

Data Fetching: TanStack Query

Database: PostgreSQL

ORM: Drizzle ORM

Validation: Zod

Authentication: Better Auth (or approved institutional provider)

Storage: Cloudflare R2

Styling: Tailwind CSS

Deployment: Vercel

Background Processing: Queue/Worker

Testing: Vitest + Playwright

4. Core Modules

Research Management

Researcher Profiles

Departments

Faculties

IPTTO Management

Innovation Management

Patent Management

Publications

Reports

Search

Audit Logs

Administration

5. User Roles

Visitor

Lecturer

Department Administrator

Faculty Administrator

IPTTO Officer

Super Administrator

Role-based permissions must be enforced throughout the application.

6. Public Website

The public website shall provide:

Homepage

Research catalogue

Research detail pages

Researcher profiles

Department pages

Faculty pages

Innovation pages

Patent pages

Reports

Statistics

Search

FAQ

Contact

All public pages should be optimized for SEO, AEO, and GEO.

7. Dashboard Requirements

Authenticated users shall have dashboards appropriate to their roles.

Features include:

Upload research

Manage publications

Review submissions

Approve or reject records

Manage innovations

Generate reports

User administration

Audit history

8. Research Workflow

Lecturer submits research.

File uploaded directly to Cloudflare R2.

Metadata stored in PostgreSQL.

Department review.

Faculty/IPTTO review (where applicable).

Publication.

Public indexing.

9. Storage Requirements

Cloudflare R2 is the primary object storage.

PostgreSQL stores metadata only.

Browser uploads directly to R2 using signed URLs.

Private downloads use short-lived signed URLs.

Large files must not be proxied through Vercel.

10. Architecture

The implementation must follow Clean Architecture.

Presentation

↓

Application

↓

Domain

↓

Repository Interfaces

↓

Infrastructure

Business logic must remain independent of frameworks.

11. Search

Initial search implementation should use PostgreSQL Full Text Searchwith support for:

Keyword search

Filters

Pagination

Ranking

The architecture should allow future migration to a dedicated searchengine.

12. AI Features

Background workers may generate:

AI summaries

Keywords

Search indexes

Document metadata

These operations must not run during the upload request.

13. Security

The system must implement:

Authentication

Role-based authorization

Audit logging

Input validation

Secure sessions

Signed URLs

File validation

Rate limiting

14. Performance

The application should:

Cache public pages.

Use on-demand revalidation.

Optimize SQL queries.

Avoid unnecessary polling.

Paginate large datasets.

Lazy-load heavy components.

Queue expensive operations.

15. Vercel Cost Optimizations

The implementation should:

Upload directly to Cloudflare R2.

Download directly from Cloudflare R2.

Cache public pages.

Use background workers.

Avoid storing files in PostgreSQL.

Aggregate related queries.

Monitor platform usage.

Platform-specific deployment recommendations should always be verifiedagainst the latest official Vercel documentation before productiondeployment.

16. Testing

Required test coverage:

Unit Tests

Integration Tests

End-to-End Tests

Storage Tests

Authorization Tests

17. Coding Standards

No business logic inside UI components.

Use dependency inversion.

Separate application and infrastructure.

Repositories behind interfaces.

Thin route handlers.

Strong typing with TypeScript.

18. Future Enhancements

ORCID

DOI Integration

CrossRef

OpenAlex

Recommendation engine

Semantic search

Public API

Mobile application

19. Deliverables

The completed system shall include:

Responsive public website

Administrative dashboards

Research repository

Innovation repository

Patent management

Secure storage

Reporting

Analytics

Audit logs

Search

Automated testing

Deployment documentation

20. Guiding Principles

Clean Architecture

Scalability

Maintainability

Testability

Security

Cost efficiency

Accessibility

Standards compliance
