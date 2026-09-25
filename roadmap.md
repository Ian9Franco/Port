# Roadmap de Port

## North Star

Construir un sistema privado que encuentre, evalúe y prepare las mejores oportunidades laborales posibles para Ian, independientemente del campo, usando evidencia real, transferibilidad y potencial de carrera.

Port debe reducir el costo de:

- buscar en múltiples rubros;
- entender si una vacante realmente encaja;
- detectar oportunidades de transición;
- adaptar el CV;
- comparar alternativas;
- llevar seguimiento.

Sin reemplazar la decisión humana.

---

# Estado actual

## ✅ Fase 0 — Foundation

Completado.

### Repo y workflow base

- repositorio privado;
- estructura de datos;
- templates;
- documentación;
- GitHub Actions programado;
- script de Opportunity Radar.

### Radar inicial

Fuentes implementadas:

- Remotive;
- Arbeitnow;
- Get on Board.

### MAIN / SIDE

Separación conceptual y de scoring:

- MAIN = trabajo principal;
- SIDE = ingreso secundario remoto.

### Outputs definidos

- `data/opportunities.json`
- `reports/latest.md`
- `reports/all-candidates.md`
- `reports/application-prep.md`

### Perfil inicial

- `PROFILE.md`
- `TARGETS.md`

### Capability discovery

- `thougtian.md`: evidencia derivada únicamente de GitHub;
- `career/SELF_ASSESSMENT.md`: información confirmada por el usuario.

### Filosofía

- `filosofia.md`: principios del proyecto;
- `roadmap.md`: plan de evolución.

---

# 🚧 Fase 1 — Radar operativo

## Objetivo

Lograr una corrida real, repetible y observable de punta a punta.

## Tareas

- verificar por qué GitHub Actions todavía no generó runs;
- validar que el workflow esté habilitado en la rama default;
- ejecutar manualmente la primera corrida;
- validar Remotive;
- validar Arbeitnow;
- validar Get on Board;
- manejar timeouts, rate limits y respuestas inválidas;
- confirmar deduplicación;
- confirmar persistencia de estados;
- verificar que el bot pueda hacer push a `main` o rediseñar el mecanismo si branch protection lo impide;
- registrar errores por fuente sin perder toda la corrida.

## Definition of Done

Una corrida produce datos reales en:

```text
data/opportunities.json
reports/latest.md
reports/all-candidates.md
reports/application-prep.md
```

y el siguiente run preserva estados y notas.

---

# 🔜 Fase 2 — Career model estructurado

## Objetivo

Dejar de depender de Markdown como fuente principal para el matcher.

## Estructura propuesta

```text
career/
  github-evidence.json
  employment-evidence.json
  education.json
  certifications.json
  self-assessment.json
  preferences.json
  constraints.json
  career-paths.json
```

## Cada capability debería poder guardar

```json
{
  "skill": "GitHub Actions",
  "evidence_strength": "strong",
  "confidence": "medium",
  "sources": ["MIM", "Pontorno-vault"],
  "type": "direct",
  "last_seen": "2026",
  "notes": ""
}
```

## Reglas

Separar:

- evidencia observada;
- experiencia laboral;
- autoevaluación;
- inferencia;
- preferencia;
- gap.

## Definition of Done

El matcher puede leer un esquema estable sin parsear `PROFILE.md`.

---

# 🔜 Fase 3 — Potential Matcher v1

## Objetivo

Reemplazar el matcher basado principalmente en keywords por un matcher de potencial.

## Dimensiones mínimas

### Current Fit

¿Qué tanto del puesto está demostrado hoy?

### Transferability

¿Qué conocimientos existentes se trasladan aunque la herramienta exacta sea distinta?

### Gap Cost

¿Qué falta y cuánto cuesta adquirirlo?

### Evidence Confidence

¿Qué tan defendible es cada match?

### Career Potential

¿Qué tan buen salto profesional representa?

### Relocation Value

¿Ayuda al objetivo de emigración?

### Compensation Fit

¿Supera o justifica el costo del cambio?

### Workstyle Fit

¿Tiene demasiada repetitividad, fricción o interacción no deseada?

### Commute Burden

Para roles presenciales/híbridos.

## Salida esperada

```text
Current Fit: 72
Transferability: 88
Gap Cost: Medium
Career Potential: 91
Evidence Confidence: High

Reasons:
+ ...
+ ...

Gaps:
- ...
- ...
```

## Definition of Done

Una vacante DevOps, SAP, Data o Cloud puede aparecer aunque no exista experiencia laboral con ese título, siempre que la transferencia sea razonable.

---

# 🔜 Fase 4 — Career paths dinámicos

## Objetivo

Permitir exploración deliberada sin encasillar el perfil.

## Familias iniciales

### Core

- Full-Stack
- Product Engineering
- Backend
- Automation
- Integration
- Internal Tools
- Applied AI

### Adjacent

- DevOps
- Platform
- Developer Experience
- Build/Release
- QA Automation
- Data / Analytics Engineering
- AppSec

### Exploratory

- SAP BTP / Integration
- Cloud Engineering
- Cybersecurity
- deeper enterprise Java
- other high-transfer opportunities discovered by the market

## Regla

Las familias son ayudas para discovery.

No son una whitelist.

## Definition of Done

El sistema puede crear una nueva familia candidata a partir de ofertas recurrentes con alta transferibilidad.

---

# 🔜 Fase 5 — Mejorar fuentes

## Objetivo

Evitar que la calidad del sistema quede limitada por tres job boards.

## Prioridades

### General / LATAM

- fuentes con APIs o feeds legales;
- boards regionales;
- empresas con career APIs accesibles.

### Europa / relocation

- España;
- Unión Europea;
- empresas con relocation;
- visa sponsorship cuando sea detectable.

### Especializadas

- DevOps / Cloud;
- Data;
- Cybersecurity;
- SAP / Enterprise;
- Applied AI;
- remote engineering.

### Plataformas asistidas

Evaluar integraciones autorizadas para:

- LinkedIn;
- Upwork;
- Contra;
- Workana;
- otras.

## Regla

No construir scraping frágil cuando existe una API, feed o integración autorizada.

## Definition of Done

La cobertura no depende de una sola categoría de empleos remotos.

---

# 🔜 Fase 6 — Trust / Scam layer

## Objetivo

Ayudar a responder:

> "¿Cómo sé que no es chamuyo?"

## Señales

- dominio oficial;
- empresa verificable;
- career page;
- antigüedad del dominio cuando sea accesible;
- existencia consistente de la empresa;
- duplicados/spam;
- descripción sospechosamente vaga;
- salario irreal;
- solicitud de dinero;
- contacto fuera de canales razonables;
- inconsistencias entre empresa y URL.

## Salida

```text
SOURCE TRUST: official API
COMPANY TRUST: medium
LISTING RISK: low / unknown / high
```

## Regla

No confundir "vino de una API legítima" con "la vacante es legítima".

---

# 🔜 Fase 7 — Application Compiler

## Objetivo

Que una oportunidad seleccionada genere el material necesario para aplicar.

## Trigger

Cuando un candidato pasa a:

```text
shortlisted
```

## Output

```text
applications/
  company-role/
    opportunity.md
    fit-analysis.md
    gaps.md
    cv.md
    intro.md
    cover-letter.md
    interview-prep.md
```

## CV

Debe adaptar:

- orden;
- resumen;
- skills;
- proyectos;
- bullets.

No debe inventar hechos.

## Definition of Done

Una oportunidad fuerte puede pasar de discovery a "lista para aplicar" con revisión humana mínima.

---

# 🔜 Fase 8 — Tracking

## Objetivo

Seguir el pipeline real de búsqueda.

## Estados

```text
new
reviewing
shortlisted
prepared
applied
replied
interview
offer
won
lost
skipped
```

## Información útil

- fecha;
- CV usado;
- fuente;
- contacto;
- salario;
- feedback;
- etapa;
- notas.

## Definition of Done

Port puede responder:

- a cuántos trabajos se aplicó;
- qué familias responden mejor;
- qué CV funciona mejor;
- dónde se producen rechazos.

---

# 🔜 Fase 9 — Feedback loop

## Objetivo

Aprender del criterio humano sin volver el sistema una caja negra.

## Señales explícitas

Cuando el usuario:

- descarta;
- guarda;
- aplica;
- dice "esto sí";
- dice "esto no";
- llega a entrevista;
- recibe oferta.

Port ajusta pesos.

## Restricción

Nunca inferir una preferencia permanente a partir de una sola decisión.

## Definition of Done

Los Top Picks mejoran con el tiempo y cada ajuste puede explicarse.

---

# 🔜 Fase 10 — UI privada

## Objetivo

Hacer cómodo el uso cotidiano.

No construir una plataforma grande.

## Pantallas mínimas

### Dashboard

- 3 MAIN Top Picks
- 3 SIDE Top Picks
- nuevas desde la última revisión

### Opportunity

- score
- evidence
- gaps
- company
- compensation
- location
- source
- original listing

### Actions

- shortlist
- skip
- prepare application
- applied
- interview
- notes

### Career view

- capability map
- paths
- gaps recurrentes
- skills con mejor retorno de aprendizaje

## Stack probable

- Next.js
- Vercel
- almacenamiento simple / Supabase si realmente hace falta

## Definition of Done

La UI reduce fricción pero no duplica lógica del motor.

---

# 🔜 Fase 11 — Skill investment intelligence

## Objetivo

Usar las vacantes reales para decidir qué aprender.

Ejemplo:

```text
En 83 oportunidades de alto potencial:

Terraform aparece: 31
AWS: 44
Kubernetes: 27

Impacto estimado de aprender AWS:
+19 oportunidades pasan de Fit Medium a High
```

## Resultado

Port puede recomendar aprendizaje basado en mercado real, no en moda.

---

# 🔜 Fase 12 — Optional assisted application

## Objetivo

Automatizar sólo donde tenga sentido y esté permitido.

### Nivel 1

- abrir enlace;
- CV preparado;
- respuestas preparadas;
- usuario envía.

### Nivel 2

- rellenado asistido con aprobación.

### Nivel 3

- envío automático sólo si:
  - la plataforma lo permite;
  - el usuario lo habilita;
  - los datos fueron previamente revisados.

## Regla

Aplicar a 100 vacantes automáticamente no es el objetivo.

La calidad del match tiene prioridad sobre el volumen.

---

# Orden de ejecución recomendado

## Próximos PRs

### PR #6

- `filosofia.md`
- `roadmap.md`

Documenta intención y dirección del proyecto.

### PR #7

**Radar reliability**

- primera ejecución real;
- arreglar Actions;
- validar fuentes;
- generar primeros datos reales.

### PR #8

**Structured Career Model**

- pasar evidencia/preferencias/constraints a datos estructurados.

### PR #9

**Potential Matcher v1**

- Current Fit;
- Transferability;
- Gap Cost;
- Career Potential;
- Evidence Confidence.

### PR #10

**Source Expansion + Trust**

- nuevas fuentes;
- company/listing trust.

### PR #11

**Application Compiler**

- CV;
- intro;
- gaps;
- interview prep.

### PR #12

**Tracking + feedback**

### PR #13

**Private UI**

---

# Métricas de éxito

Port no debe medirse por cantidad de ofertas encontradas.

## Métricas útiles

### Precision

¿Cuántos Top Picks el usuario considera realmente interesantes?

### Discovery

¿Cuántas oportunidades útiles aparecen fuera del rubro que hubiera buscado manualmente?

### Application readiness

¿Cuánto tiempo pasa desde descubrir una oportunidad hasta estar listo para aplicar?

### Interview rate

¿Cuántas aplicaciones generan respuesta/entrevista?

### Career expansion

¿Cuántas familias profesionales razonables se descubren?

### Gap intelligence

¿El sistema identifica correctamente qué aprender para ampliar opciones?

---

# Qué no hacer

- no construir UI antes de validar el matcher;
- no sumar 30 fuentes de baja calidad sólo por volumen;
- no convertir cada keyword en una skill;
- no inflar seniority;
- no esconder gaps;
- no generar CVs falsos;
- no aplicar masivamente sin control;
- no convertir el puesto actual en la identidad profesional;
- no fijar una única carrera antes de mirar el mercado.

---

# Estado de madurez objetivo

## V1 — Useful

Encuentra oportunidades reales y genera Top Picks defendibles.

## V2 — Intelligent

Entiende transferibilidad y gaps entre campos.

## V3 — Actionable

Prepara aplicaciones completas.

## V4 — Adaptive

Aprende de decisiones y resultados.

## V5 — Career OS

Ayuda no sólo a encontrar trabajo, sino a decidir qué habilidades y movimientos maximizan la carrera a largo plazo.
