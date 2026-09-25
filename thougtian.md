# thougtian.md

> GitHub-only capability model for Port.
>
> Scope rule: this document was built from repositories and project files in `Ian9Franco/*` only.
> It intentionally ignores LinkedIn, portfolio copy, current-job title, prior chat claims, and self-description.
> A repository proves technical exposure and project evidence; it does **not** prove sole authorship, production scale, commercial ownership, or interview-level mastery by itself.

---

# 1. Executive synthesis

The repositories do **not** support a narrow identity such as "marketing developer" or "Zapier specialist".

The strongest pattern visible from projects is broader:

**product-oriented software engineer with repeated evidence across full-stack development, backend/API work, automation/integration, data processing, developer tooling, desktop packaging, security-conscious application design, CI/testing, and applied AI integration.**

The GitHub evidence suggests that Port should search across multiple technical families instead of using one job title as the profile boundary.

The correct model is:

```text
project evidence
    ↓
capabilities
    ↓
transferable skills
    ↓
role family requirements
    ↓
current fit + transition potential + gaps
    ↓
opportunity
    ↓
role-specific CV lens
```

A missing job-title keyword in the profile must not automatically eliminate a role.

---

# 2. Repositories used as primary evidence

The analysis prioritized substantive repositories with implementation, architecture, tests, infrastructure or domain logic rather than portfolio/profile repositories.

## High-signal projects

### MIM

Evidence found:

- Next.js / React / TypeScript
- Electron desktop runtime
- monorepo/workspaces
- local filesystem integration
- Supabase and PostgreSQL/RLS
- IndexedDB/offline state
- SSH/SFTP-related server-management functionality
- content-addressed storage and hashing
- binary/NBT processing
- static JVM/JAR analysis
- typed event-driven architecture
- AI provider routing/evaluation
- extensive automated tests
- architecture boundary tests
- GitHub Actions CI
- scoped CI logic
- coverage
- Codacy integration
- DAST/security checks
- Docker verification environment
- Windows desktop packaging via electron-builder
- release/update flow

Interpretation:

MIM is the strongest evidence for systems thinking, architecture, developer tooling, testing discipline, CI/CD-adjacent work, desktop engineering and integration-heavy software.

### Pontorno-vault

Evidence found:

- Next.js / React / TypeScript
- Supabase
- PostgreSQL/RLS
- authentication flows
- Argon2id key derivation
- AES-256-GCM encryption model
- key wrapping / envelope encryption
- CSP hardening
- authorization boundaries
- security-focused tests
- GitHub Actions security gate
- typecheck + tests + production build + dependency audit

Interpretation:

Strong evidence of application-security awareness, auth/data-boundary reasoning and security-conscious full-stack engineering.

### Web-Sling-Optimizer

Evidence found:

- Next.js / TypeScript
- serverless/API route design
- Sharp-based image processing
- EXIF/metadata handling
- concurrency utilities
- CLI tooling
- batch processing
- Gemini/OpenAI multimodal integration
- OpenAPI
- MCP/WebMCP-related discovery
- automated Vitest suite

Interpretation:

Evidence for product engineering, APIs, media processing, applied AI, tooling and testable modular architecture.

### Factu

Evidence found:

- Next.js / TypeScript
- Drizzle ORM
- PostgreSQL
- Zod validation
- multi-tenant / organization-aware domain design
- provider abstraction
- invoice/payment/document domain modeling
- test scripts for tenancy isolation, validation, issuance, PDF, search, payment and E2E workflow
- explicit server-side secret and authorization design

Interpretation:

Evidence for enterprise-style domain modeling, backend architecture, business systems and integration-oriented design.

### proyecto-live

Evidence found:

- Python
- FastAPI
- async SQLAlchemy
- asyncpg
- Pydantic
- Alembic
- versioned API structure
- ingestion/synchronization routes
- Next.js frontend

Interpretation:

Direct evidence that the technical range is not limited to JavaScript/TypeScript. There is credible Python API/backend exposure.

### dashpostgre

Evidence found:

- Flask
- PostgreSQL via psycopg2
- SQL joins, grouping and aggregation
- Pandas
- REST endpoints
- reporting/dashboard data transformations

Interpretation:

Evidence for SQL/data-oriented backend work and analytics pipelines at small-project scale.

### Java final project

Repository: `Ian-franco-collada-pontorno-java`

Evidence found:

- Java 17
- Spring Boot
- Spring Web
- Spring Data JPA
- MySQL
- layered architecture
- REST CRUD
- entity/repository/service/controller separation

Interpretation:

Foundational direct Java/Spring evidence. It is not enough to claim current deep enterprise-Java seniority, but Java should not be treated as an unknown technology.

### Backend final project

Repository: `Ian-franco-collada-pontorno-Backend`

Evidence found:

- Node.js
- Express
- MongoDB
- Mongoose
- Socket.IO
- REST APIs
- real-time functionality

Interpretation:

Direct backend and NoSQL exposure beyond Next.js route handlers.

### PropHunter

Evidence found:

- Python scraping
- BeautifulSoup / Requests
- modular scraper design
- CSV / JSON / Excel export
- Next.js frontend
- pywebview desktop shell
- PyInstaller
- custom release/build script
- frontend build + executable packaging pipeline

Interpretation:

Evidence for automation, scraping/data extraction, cross-stack integration, desktop packaging and build engineering.

### vision / Jar.vis

Evidence found:

- Python
- LiteLLM
- FastAPI
- ChromaDB
- SQLite
- local Ollama models
- embeddings
- hybrid local/cloud model routing
- configurable orchestration
- MCP package
- search integration
- memory/routing/evaluation concepts

Interpretation:

Evidence for applied AI systems and orchestration. This supports AI application/agent engineering much more than model-training or ML-research claims.

### IMGSCRAP

Evidence found:

- Python backend
- scraping
- image classification
- local/cloud LLM integration
- Gemini/Ollama
- CLIP-related image classification
- FastAPI-oriented architecture
- document generation
- structured extraction and content automation

Interpretation:

Additional evidence for applied AI, automation and data/content pipelines.

### Escalation-Tracker

Evidence found:

- Next.js / TypeScript
- Supabase
- PostgreSQL/RLS
- business-rule calculations
- multi-client campaign tracking

Interpretation:

Technical implementation in a marketing/performance domain is real evidence, but it should be treated as one domain example rather than the user's entire professional identity.

### meta-dash / pyexc

Evidence found:

- XLSX ingestion
- metric normalization
- advertising analytics
- scoring
- trends/anomalies
- reporting
- dashboarding
- JSON/PDF/TXT outputs

Interpretation:

Evidence for analytics-oriented product work and data transformation.

### ArbiPy / ArbiWeb

Evidence found:

- Python simulation
- JSON history/statistics
- arbitrage opportunity detection
- Next.js monitoring dashboard
- data visualization

Interpretation:

Further evidence for quantitative/data-oriented software projects.

### OMEGA

Evidence found:

- financial simulation
- PDF/Markdown ingestion
- calculations and scenario modeling
- modular TypeScript application

Interpretation:

Evidence for business-rule engines and deterministic/quantitative application logic.

### Ser Leyenda

Evidence found:

- deterministic simulation engine
- seeded outcomes
- domain-specific engines
- state migrations
- persistent local state
- separation of engine and UI

Interpretation:

Evidence for non-trivial domain modeling, simulation logic and architectural separation.

### R6-Picker

Evidence found:

- Next.js / TypeScript
- Drizzle ORM
- tests
- database-oriented project structure

Interpretation:

Additional evidence for typed web/database development.

---

# 3. Capability map derived from GitHub

This is evidence strength, not a self-reported skill rating.

## Strong repeated evidence

### TypeScript / JavaScript application engineering

Repeated across many modern repositories.

Evidence includes:

- Next.js
- React
- TypeScript
- server routes
- typed domain models
- component architecture
- state management
- build systems
- tests

Treat as a core capability.

### Full-stack product engineering

Repeated ability to combine:

- UI
- API/backend logic
- databases
- auth
- business rules
- deployment/build concerns

Treat as a core capability.

### APIs and integrations

Evidence includes:

- REST APIs
- external AI providers
- Supabase
- fiscal-provider abstraction
- ingestion routes
- SSH/SFTP-oriented work in MIM
- scraping/data-source adapters
- multimodal provider integrations

Treat as a core capability.

### SQL / PostgreSQL / relational data modeling

Evidence includes:

- PostgreSQL
- Supabase
- RLS
- Drizzle
- psycopg2
- SQL joins/aggregates
- multi-tenant domain modeling

Treat as a core-to-strong capability area.

### Testing / engineering quality

Evidence includes:

- unit tests
- integration tests
- architecture tests
- security tests
- E2E-style scripts
- coverage
- CI gates

MIM is particularly strong evidence.

### Applied AI integration

Evidence includes:

- Gemini
- OpenAI
- local Ollama models
- LiteLLM
- ChromaDB
- embeddings
- provider routing
- evaluation
- AI-assisted extraction/image classification

This supports **Applied AI / AI Product Engineering / AI Integration**.

It does **not** by itself support claims of deep model training, ML research, CUDA engineering or advanced statistical ML.

### Security-aware application engineering

Evidence includes:

- RLS
- auth boundaries
- Argon2id
- AES-GCM
- CSP
- DAST
- static analysis concepts
- dependency auditing
- secret handling

This supports security-conscious engineering and some AppSec-adjacent opportunities.

### Automation / tooling

Evidence includes:

- build/release scripts
- CLI tools
- batch image/data processing
- scraping
- CI automation
- packaging
- report generation
- ingestion pipelines

Treat as a core capability family.

## Moderate repeated evidence

### Python backend and automation

Direct evidence:

- FastAPI
- Flask
- SQLAlchemy
- Pandas
- BeautifulSoup
- Requests
- PyInstaller
- AI orchestration codebases

The breadth is meaningful.

Depth relative to TypeScript cannot be determined from GitHub alone.

### Desktop application engineering

Evidence:

- Electron
- pywebview
- PyInstaller
- native packaging/release flows

Strong enough to include desktop/hybrid-app roles in search when requirements fit.

### Data / analytics engineering

Evidence:

- Pandas
- SQL aggregation
- XLSX processing
- scoring/anomaly logic
- reporting pipelines
- quantitative simulations
- dashboards

Good transfer base for BI/data-product/analytics-engineering roles.

No strong evidence yet for:

- dbt
- Airflow
- Spark
- Kafka
- cloud data warehouses
- large-scale batch/stream processing

### Java backend

Direct Spring Boot/JPA/MySQL project evidence exists.

Current depth and recency are unknown.

This should be treated as a real but lower-confidence capability, not as zero experience.

### MongoDB / NoSQL

Direct Node/Mongoose project evidence exists.

Depth and recency are unknown.

---

# 4. Infrastructure / DevOps evidence

## Direct evidence found

- GitHub Actions
- multi-stage CI pipelines
- reproducible npm installs
- typecheck/lint/test/build gates
- coverage artifact handling
- dependency audit
- DAST step
- Dockerfile
- Node runtime/version configuration
- packaging/release scripts
- Electron Builder
- PyInstaller
- environment-variable handling
- monorepo/workspaces
- application deployment-oriented configuration

## What this means

There is a credible **DevOps / Platform transition base**.

The GitHub evidence supports searching roles where software engineering and delivery overlap, for example:

- Junior/Mid DevOps with strong software component
- Platform Engineer entry/associate roles
- Developer Experience / Developer Productivity
- Build & Release Engineer
- CI/CD Engineer
- Software Engineer, Infrastructure tooling
- Internal Developer Platform roles with application focus

## Gaps not directly demonstrated in inspected repositories

No strong direct repository evidence was found for:

- Kubernetes administration
- Terraform / Infrastructure as Code
- AWS infrastructure
- Azure infrastructure
- GCP infrastructure
- production Linux fleet administration
- Prometheus/Grafana operations
- ELK/OpenSearch operations
- production incident/on-call ownership

Therefore:

**DevOps should be an adjacent search family, not a false claim of established senior DevOps experience.**

Port should still surface DevOps roles when the missing requirements are learnable and the software/CI/tooling overlap is high.

---

# 5. SAP / enterprise-system potential

## Direct SAP evidence

None found in the inspected project repositories.

Therefore Port must never state existing SAP professional experience.

## Transferable evidence relevant to SAP technical paths

Projects do show:

- API integration
- Java/Spring foundations
- TypeScript/JavaScript
- business-domain modeling
- multi-tenant systems
- auth/authorization
- workflow logic
- data transformation
- external-provider abstraction
- enterprise-style invoice/fiscal concepts
- PostgreSQL/SQL

This creates plausible transition potential for technical SAP-adjacent paths such as:

- SAP BTP development
- SAP Integration Suite / integration-oriented roles
- SAP Build / workflow-oriented technical roles
- enterprise integration developer
- technical consultant roles where programming/API skills matter

It does **not** create evidence for:

- SAP Basis administration
- ABAP proficiency
- SAP FI/CO/MM/SD functional consulting
- S/4HANA implementation experience

Port should classify SAP as **exploratory / transferable**, and only surface roles where the required SAP-specific gap is reasonable.

---

# 6. Role-family potential from project evidence

Legend:

- **Current evidence: Strong** = repeated direct implementation evidence.
- **Current evidence: Moderate** = direct evidence exists but narrower, older or less repeated.
- **Current evidence: Foundational** = limited direct exposure.
- **Potential** estimates transferability only; it does not mean the role is guaranteed attainable.

| Role family | Current evidence | Transition potential | Main gaps / caveats |
|---|---|---|---|
| Full-Stack Software Engineer | Strong | High | seniority must be calibrated per vacancy |
| Product Engineer | Strong | High | commercial/team-scale ownership unknown |
| Backend/API Engineer — TypeScript/Node | Strong | High | large distributed production scale unknown |
| Backend/API Engineer — Python | Moderate | High | production depth/recency should be validated |
| Automation Engineer | Strong | High | vendor-specific platforms may require ramp-up |
| Integration Engineer | Strong | High | enterprise middleware-specific experience varies |
| Solutions / Implementation Engineer | Strong technical base | High if communication fits | customer-facing experience unknown |
| Applied AI / AI Product Engineer | Strong application evidence | High | not ML-research/model-training evidence |
| Developer Tools / DevEx Engineer | Strong | High | organization-scale platform ownership unknown |
| Build / Release Engineer | Moderate-Strong | High | enterprise release tooling varies |
| QA Automation / Software Quality Engineer | Moderate-Strong | High | browser automation frameworks not strongly evidenced |
| DevOps Engineer | Moderate adjacent | Medium-High | cloud/IaC/K8s/Linux-ops gaps |
| Platform Engineer | Moderate adjacent | Medium-High | Kubernetes/cloud/IaC gaps |
| SRE | Foundational-adjacent | Medium | observability/on-call/reliability ops gaps |
| Cloud Engineer | Foundational-adjacent | Medium | AWS/Azure/GCP infrastructure evidence missing |
| Data / Analytics Engineer | Moderate | Medium-High | dbt/Airflow/warehouse/Spark evidence missing |
| BI / Data Product Engineer | Moderate-Strong | High | tool-specific BI stack unknown |
| Data Scientist | Foundational | Medium-Low | statistical/ML modeling depth not evidenced |
| ML Engineer | Foundational-Moderate applied AI | Medium | training pipelines/MLOps/model deployment depth unclear |
| AppSec / Product Security Engineer | Moderate adjacent | Medium-High | dedicated security operations/pentest experience missing |
| Java/Spring Backend Engineer | Foundational-Moderate | Medium | current fluency and professional depth unknown |
| Enterprise Integration Developer | Moderate-Strong transferable base | High | vendor-specific middleware experience unknown |
| SAP BTP / Integration technical path | No direct SAP; transferable base | Medium | SAP-specific learning required |
| SAP functional consultant | None | Unknown/Low from GitHub alone | functional SAP/domain certification absent |
| .NET Engineer | None direct | Unknown | no direct .NET/C# evidence found |
| Technical RevOps / Growth Engineering | Strong project-domain overlap | High | should remain one option, not identity anchor |
| Technical Product / Internal Tools Engineer | Strong | High | role naming varies widely |
| Desktop Application Engineer | Moderate-Strong | High | platform-specific native depth varies |

---

# 7. What can be answered from GitHub alone

This section maps the original discovery questions to repository evidence.

## Q1 — What can be built or solved today without learning from zero?

**Answerable with good confidence.**

Project evidence supports the ability to build or contribute to:

- modern web applications
- full-stack products
- REST APIs
- typed backend services
- relational data-backed applications
- Supabase-based auth/data systems
- business-rule engines
- desktop wrappers/apps
- CLI/batch tools
- image/media processing tools
- scraping/extraction systems
- analytics dashboards
- report/data transformation pipelines
- AI-provider integrations
- local/cloud LLM orchestration
- CI/test/build pipelines
- packaging/release automation

## Q2 — What has actually been built?

**Answerable at repository level.**

Examples include:

- MIM — desktop/cloud Minecraft management and diagnostics platform
- Pontorno Vault — encrypted credential vault
- Web-Sling Optimizer — image-processing/API/CLI product
- Factu — invoicing/business-domain platform architecture
- PropHunter — real-estate scraping desktop tool
- vision/Jar.vis — local/cloud AI orchestrator
- IMGSCRAP — scraping + AI content pipeline
- Escalation Tracker — campaign budget escalation system
- meta-dash / pyexc — advertising analytics
- ArbiPy / ArbiWeb — arbitrage simulation + monitoring
- OMEGA — financial simulator
- Ser Leyenda — deterministic career simulation
- Java Spring CRUD/API project
- Node/Express/Mongo backend project
- FastAPI/SQLAlchemy project
- Flask/PostgreSQL analytics API

Caveat: GitHub shows repository implementation, not whether every project reached production or had real users.

## Q3 — Real level in each technology?

**Partially answerable.**

GitHub can establish evidence strength and repetition, but not reliably distinguish:

- "can work independently"
- "needs documentation"
- "can teach it"
- "used it once"
- "used it with AI assistance but understands it deeply"

Therefore Port should store **evidence strength** separately from **self-assessed working level**.

## Q4 — Which parts of MIM were personally implemented?

**Not answerable reliably from repository contents alone.**

Even commit authorship does not prove which architectural/code decisions were personally authored versus generated, assisted or contributed collaboratively.

This requires user confirmation.

## Q5 — What is done in the current job?

**Not answerable from GitHub only.**

## Q6 — What was done in previous jobs?

**Not answerable from GitHub only.**

## Q7 — Formal education and what it taught?

**Partially answerable.**

Repository READMEs explicitly show at least course/final-project context for:

- Java / Spring Boot
- Node.js backend

But GitHub cannot reconstruct the full education history, degree status or formal curriculum.

## Q8 — Certifications?

**Not answerable from project repositories.**

## Q9 — Technologies known but not yet comfortable using professionally?

**Partially answerable.**

GitHub can identify technologies with shallow or isolated evidence, but only the user can confirm confidence.

Candidates requiring confirmation include:

- Java/Spring
- MongoDB/Mongoose
- deeper Python backend
- Docker beyond development/verification use
- security-specialist work
- DevOps/platform operations

## Q10 — New areas worth learning for a strong opportunity?

**Not answerable as a preference.**

GitHub can identify plausible transitions but cannot know willingness.

Plausible technical transitions from evidence include:

- DevOps / Platform
- Cloud
- enterprise integration
- SAP BTP / Integration
- deeper backend
- data/analytics engineering
- AppSec
- AI application engineering

## Q11 — How much time can be invested to close a skill gap?

**Not answerable.**

## Q12 — What type of technical work is most enjoyable?

**Not answerable reliably.**

Repository frequency can suggest interests, but frequency can also reflect necessity or experimentation.

## Q13 — What work should be avoided even if it pays well?

**Not answerable.**

## Q14 — Preferred amount of human/customer interaction?

**Not answerable.**

## Q15 — Acceptable seniority by career path?

**Not answerable.**

This is critical because GitHub evidence can support different levels in different families.

Example:

- software/full-stack may support a higher target than
- SAP-specific or cloud-infrastructure roles

But the acceptable downgrade/ramp path must be user-defined.

## Q16 — Minimum compensation for MAIN and SIDE?

**Not answerable.**

## Q17 — Acceptable work modality / commute?

**Not answerable from GitHub.**

## Q18 — Professional language level?

**Partially answerable.**

There is direct evidence of technical documentation in both Spanish and English, particularly in MIM and other repositories.

This supports written technical-English exposure.

GitHub cannot establish:

- spoken fluency
- interview fluency
- customer-call fluency
- negotiation fluency

## Q19 — What can be demonstrated publicly?

**Answerable.**

There is substantial public technical proof, including MIM and multiple application repositories.

The strongest demonstrable areas are:

- architecture
- full-stack engineering
- CI/testing
- desktop/app packaging
- security-conscious design
- applied AI integration
- automation
- data/analytics products

## Q20 — What should Port avoid overvaluing?

**Not fully answerable without user input.**

From GitHub methodology alone, Port should automatically avoid overvaluing:

- a technology that appears in only one small/academic repo
- roadmap-only features
- README claims without corresponding implementation evidence
- tools mentioned only as future options
- job-title labels inferred from domain language
- AI-generated sophistication that cannot be tied to working code/tests

But personal "I used this once and do not want it represented" constraints require user input.

## Q21 — Willingness to enter a new industry?

**Not answerable.**

Projects span many domains, which proves adaptability, not preference.

Domains visible include:

- gaming
- security
- finance
- advertising
- real estate
- invoicing/business operations
- AI tooling
- media/image processing

## Q22 — What should the next job optimize for?

**Not answerable from GitHub.**

GitHub cannot determine whether the priority is:

- compensation
- learning
- stability
- technical depth
- brand/company
- relocation
- work-life balance
- remote work
- seniority/title
- long-term career leverage

---

# 8. Search strategy Port should derive from this evidence

Port should **not** start from a fixed role title.

For every vacancy it should calculate separate dimensions:

## A. Current Fit

How much of the vacancy is already demonstrated by project evidence?

Signals:

- exact technologies
- architecture patterns
- database experience
- testing
- integration patterns
- domain logic

## B. Transferability

How much of the user's existing engineering capability maps to the new role even when exact tools differ?

Example:

```text
GitHub Actions + Docker + release automation + packaging
→ transferable to DevOps/build/platform work
```

```text
APIs + Java foundation + business-domain modeling + integrations
→ transferable to SAP BTP / enterprise integration
```

## C. Gap Cost

Classify gaps:

- terminology/tool syntax gap
- ecosystem gap
- architectural gap
- operational experience gap
- domain knowledge gap
- certification/access barrier

A role with high transferability and a small tool gap should not be hidden.

## D. Evidence Confidence

Each match should state where the claim comes from.

Example:

```text
Evidence: STRONG
- MIM CI workflow
- MIM Dockerfile
- Pontorno Vault security workflow

Gap:
- no Kubernetes proof
- no Terraform proof
- no AWS infrastructure proof
```

## E. Career Potential

Different from Current Fit.

A role can be:

```text
CURRENT FIT: Medium
CAREER POTENTIAL: High
GAP: Learnable
SHOW: Yes
```

That is the mechanism that prevents one current CV/rubro from locking the search.

---

# 9. CV lenses that can be generated from the same evidence

These are not separate identities. They are different orderings of the same verified facts.

## Software / Product Engineering lens

Emphasize:

- MIM
- Next.js/React/TypeScript
- APIs
- architecture
- databases
- testing
- product delivery

## Backend / Integration lens

Emphasize:

- FastAPI
- Flask
- Node/Express
- Spring Boot
- PostgreSQL
- MongoDB
- provider abstractions
- APIs
- ingestion/data pipelines

## Automation / Tooling lens

Emphasize:

- scrapers
- CLI/batch utilities
- build scripts
- packaging
- workflow automation
- integration adapters
- report generators

## DevOps / Platform-transition lens

Emphasize only verified evidence:

- GitHub Actions
- CI gates
- Docker
- release/build automation
- monorepo/workspaces
- packaging
- tests/coverage
- security checks

Then explicitly list missing requirements instead of pretending they exist.

## Data / Analytics lens

Emphasize:

- SQL
- PostgreSQL
- Pandas
- XLSX ingestion
- aggregations
- anomaly/scoring logic
- dashboards
- quantitative simulations

## Applied AI lens

Emphasize:

- provider integrations
- LiteLLM
- local/cloud model routing
- ChromaDB
- embeddings
- Gemini/OpenAI/Ollama
- multimodal processing
- AI evaluation/orchestration

Avoid claiming:

- foundation-model training
- advanced ML research
- GPU/CUDA expertise

## Enterprise / SAP-transition lens

Emphasize:

- integrations/APIs
- Java foundation
- business-domain modeling
- multi-tenancy
- authentication/authorization
- SQL
- provider abstraction
- invoicing/workflow systems

Then mark SAP-specific technologies as gaps unless future evidence is added.

---

# 10. Important anti-bias rules for Port

1. Never equate current project domain with career identity.
2. Never require an exact previous job title to show a vacancy.
3. Never treat a missing vendor keyword as a hard rejection when architecture/skills transfer.
4. Never claim experience merely because a README mentions a future technology.
5. Prefer working code, tests, manifests and CI configuration over marketing copy.
6. Separate project evidence from self-reported proficiency.
7. Separate current fit from transition potential.
8. Expose the gap instead of hiding the opportunity.
9. Do not infer seniority solely from repository complexity.
10. Do not infer commercial production scale from a public repository.
11. Do not infer sole authorship from repository ownership.
12. A career path can be searched experimentally without becoming the user's permanent profile.

---

# 11. Unresolved information that GitHub cannot provide

These are the remaining inputs required from the user before Port can become a reliable cross-field career matcher.

1. Personal ownership/authorship:
   - Which major parts of MIM and the other flagship repositories were personally designed/implemented?
   - Which were heavily AI-generated, tutorial-based, collaborative or primarily experimental?

2. Current employment:
   - What tasks are actually performed today?
   - Which technical responsibilities are used repeatedly?

3. Previous employment:
   - What non-GitHub work experience exists that should count as evidence?

4. Formal education:
   - Degrees, courses and current study status beyond what project READMEs reveal.

5. Certifications:
   - Which certifications are currently valid and relevant?

6. Working-confidence calibration:
   - For Java/Spring, Python/FastAPI, SQL/Postgres, Docker, GitHub Actions, React/Next, Supabase, MongoDB and AI tooling:
     - can use with documentation
     - can work independently
     - can debug confidently
     - can design from scratch
     - can teach/review others

7. Learning willingness:
   - Which adjacent paths are acceptable if a good vacancy requires ramp-up?
   - Examples: SAP, DevOps, Cloud, Data, Java enterprise, AppSec.

8. Gap budget:
   - How much learning time is acceptable before applying: days, weeks or months?

9. Work-preference:
   - Which technical activities are most enjoyable?
   - Which activities should be avoided?

10. Human interaction:
    - Preferred level of client/stakeholder/customer-facing work.

11. Seniority flexibility:
    - Is entering a new field at junior/associate level acceptable when long-term upside is strong?

12. Compensation:
    - Minimum acceptable MAIN compensation.
    - Minimum worthwhile SIDE compensation/rate.

13. Work modality:
    - Remote/hybrid/on-site limits and maximum acceptable commute.

14. English:
    - spoken/interview/customer-call level.

15. Representation exclusions:
    - Which technologies/projects should Port not treat as meaningful experience even though they exist on GitHub?

16. Industry openness:
    - Are there industries the user will not work in?

17. Optimization priority:
    - compensation
    - learning
    - stability
    - technical growth
    - relocation
    - remote flexibility
    - company prestige
    - work-life balance

---

# 12. Recommended next schema

Structured files now live under `career/` (see `github-evidence.json`, `self-assessment.json`, etc.) and are loaded by `scripts/load-career-model.mjs`.

Suggested separation:

```text
career/
  github-evidence.json
  self-assessment.json
  employment-evidence.json
  education.json
  preferences.json
  career-paths.json
```

A vacancy should never be matched against only one `PROFILE.md`.

It should be matched against:

```text
verified project evidence
+ confirmed work evidence
+ self-assessed confidence
+ learnable adjacent skills
+ personal constraints
+ vacancy requirements
```

That is the foundation for a role-agnostic search system.
