# Filosofía de Port

## Intención

Port existe para resolver un problema concreto:

> Encontrar las mejores oportunidades laborales posibles para Ian sin obligarlo a elegir primero un rubro, un título profesional o una única versión de su CV.

La búsqueda laboral tradicional suele empezar al revés:

1. elegir un puesto;
2. adaptar el CV a ese puesto;
3. buscar solamente dentro de ese rubro;
4. ignorar oportunidades de otros campos porque cambiar de CV y contexto tiene fricción.

Port invierte ese proceso:

```text
mercado
  ↓
oportunidad concreta
  ↓
evidencia y capacidades reales
  ↓
transferibilidad
  ↓
gaps
  ↓
potencial profesional
  ↓
decisión humana
  ↓
CV / presentación adaptada
```

El objetivo no es decidir una carrera por adelantado.

El objetivo es encontrar, entre distintos campos, las oportunidades con mejor combinación de:

- capacidad actual;
- habilidades transferibles;
- costo razonable de aprendizaje;
- crecimiento técnico;
- potencial de emigración;
- compensación;
- modalidad;
- calidad del trabajo;
- proyección futura.

---

# 1. Port no es un buscador por título

Port no debe asumir que una persona sólo puede aplicar a trabajos cuyo título coincide con su trabajo actual.

Por ejemplo, una oportunidad puede ser relevante aunque el título sea:

- Full-Stack Engineer
- Backend Engineer
- DevOps Engineer
- Platform Engineer
- Cloud Engineer
- Data Engineer
- SAP BTP Developer
- Integration Engineer
- Applied AI Engineer
- Product Engineer
- AppSec Engineer
- Solutions Engineer
- Developer Experience Engineer

La pregunta principal no es:

> "¿Ian ya tuvo exactamente este puesto?"

La pregunta es:

> "¿Qué pide esta oportunidad, qué evidencia existe, cuánto se transfiere y qué tan razonable es cerrar lo que falta?"

---

# 2. Evidencia antes que etiquetas

Port debe distinguir entre:

- evidencia observada;
- experiencia laboral confirmada;
- autoevaluación;
- inferencia de transferibilidad;
- interés futuro.

No son lo mismo.

Ejemplo:

```text
Docker en un proyecto real
≠
experiencia profesional administrando infraestructura Docker a escala
```

Pero tampoco significa cero conocimiento.

Port debe poder representar:

```text
EVIDENCIA DIRECTA: sí
PROFUNDIDAD PROFESIONAL: no confirmada
TRANSFERIBILIDAD: alta
```

La fuente de una afirmación debe poder rastrearse.

---

# 3. La IA asistida no elimina autoría

Los proyectos pueden haber tenido implementación asistida por IA.

Eso no elimina automáticamente:

- la idea;
- la identificación del problema;
- el diseño del producto;
- las decisiones;
- los criterios de aceptación;
- la iteración;
- el debugging;
- la capacidad de evaluar si una implementación sirve o no.

Port debe evitar dos errores opuestos:

1. fingir que toda implementación fue escrita sin ayuda;
2. asumir que el uso de IA invalida el conocimiento demostrado.

La evidencia debe describirse con precisión.

---

# 4. Fit actual y potencial son cosas distintas

Cada oportunidad debe evaluarse al menos en dos tiempos:

## Current Fit

¿Qué porcentaje del trabajo puede abordarse hoy con evidencia y conocimientos ya disponibles?

## Career Potential

¿Qué tan buena es la oportunidad considerando transferencia, aprendizaje, crecimiento y futuro?

Una vacante puede ser:

```text
CURRENT FIT: medio
CAREER POTENTIAL: alto
GAP COST: razonable
DECISIÓN: mostrar
```

Esto es especialmente importante para transiciones a:

- SAP
- DevOps
- Cloud
- Cybersecurity
- Data

---

# 5. Los gaps deben explicarse, no ocultar la oportunidad

Un requisito faltante no debe ser automáticamente un rechazo.

Port debe distinguir:

### Gap de herramienta

Ejemplos:

- Terraform
- AWS
- SAP BTP
- Databricks

Puede ser relativamente rápido de aprender si existen fundamentos transferibles.

### Gap de ecosistema

Requiere familiarizarse con una plataforma, convenciones o tooling nuevo.

### Gap de experiencia operativa

Ejemplos:

- producción 24/7;
- on-call;
- administrar clusters;
- incident response real.

Es más difícil de reemplazar sólo con estudio.

### Gap fundamental

La vacante exige capacidades que no aparecen ni directa ni indirectamente en la evidencia.

Port debe penalizar cada tipo de gap de forma diferente.

---

# 6. El CV no define la búsqueda

Port no debe buscar únicamente lo que entra en un CV existente.

Debe existir una fuente canónica de hechos y evidencias.

Después, para cada oportunidad, Port puede cambiar:

- orden;
- énfasis;
- proyectos destacados;
- tecnologías relevantes;
- resumen profesional.

Pero nunca debe cambiar los hechos.

Conceptualmente:

```text
MASTER EVIDENCE
    ↓
Software CV
DevOps-transition CV
Data CV
Enterprise/SAP-transition CV
Applied AI CV
Automation/Integration CV
```

Las variantes son distintas presentaciones de la misma verdad.

---

# 7. Explicabilidad obligatoria

Una recomendación sin explicación tiene poco valor.

Cada Top Pick debe responder:

> ¿Por qué apareció?

Ejemplo:

```text
DevOps Engineer

Current Fit: 64%
Transferability: alta
Career Potential: alta

Evidencia:
- GitHub Actions
- CI multi-stage
- Docker
- build/release automation
- testing y coverage

Gaps:
- Terraform
- AWS production
- Kubernetes

Por qué mostrarlo:
La base de software delivery es fuerte y los gaps principales son de tooling/ecosistema.
```

El score nunca debe ser una caja negra.

---

# 8. MAIN y SIDE resuelven problemas diferentes

## MAIN

Busca la mejor evolución para el trabajo principal.

Puede incluir:

- full-time;
- part-time;
- ciertos contratos estables;
- remoto;
- híbrido;
- presencial cuando la relación distancia / salario / crecimiento tenga sentido.

## SIDE

Busca ingreso adicional compatible con un MAIN.

Debe priorizar:

- remoto;
- alcance claro;
- flexibilidad;
- freelance;
- proyectos;
- contratos;
- part-time compatible.

MAIN y SIDE no deben compartir exactamente los mismos pesos.

---

# 9. La distancia es un costo, no un veto

Para trabajos locales, Port no debe usar una distancia rígida como filtro absoluto.

Debe modelar:

```text
commute burden
=
distancia / tiempo
× días presenciales
× costo de transporte
```

y compararlo con:

- salario;
- crecimiento;
- aprendizaje;
- modalidad;
- potencial de emigración;
- valor de la empresa;
- posibilidad futura de mejorar transporte.

Un puesto lejano puede seguir siendo una gran oportunidad.

---

# 10. Prioridades de carrera

Cuando dos oportunidades sean técnicamente viables, Port debe usar como orientación:

1. potencial de emigración / relocalización;
2. crecimiento técnico;
3. compensación;
4. aprendizaje.

Estas prioridades sirven para desempatar.

No reemplazan el criterio humano.

---

# 11. Evitar monotonía innecesaria

Port debe considerar el tipo de trabajo, no sólo el stack.

Trabajos altamente repetitivos u operativos deberían recibir una penalización relativa cuando exista una alternativa igualmente viable con más:

- problem solving;
- construcción;
- arquitectura;
- variedad;
- investigación;
- aprendizaje;
- ownership.

La intención es progresar técnicamente, no cambiar una rutina por otra.

---

# 12. El usuario decide

Port puede:

- buscar;
- filtrar;
- comparar;
- explicar;
- adaptar documentos;
- preparar aplicaciones;
- aprender preferencias;
- verificar requisitos.

La decisión final corresponde al usuario.

La aplicación automática no es una condición del proyecto.

Si en el futuro se implementa, debe ser:

- opcional;
- explícitamente autorizada;
- limitada a plataformas que lo permitan;
- reversible cuando sea posible;
- basada en información revisada.

---

# 13. Port no debe inventar

Nunca debe inventar:

- años de experiencia;
- empleadores;
- certificaciones;
- tecnologías dominadas;
- resultados;
- métricas;
- títulos;
- responsabilidades;
- nivel de inglés;
- experiencia SAP/Cloud/DevOps inexistente.

Cuando una afirmación no está confirmada:

```text
UNKNOWN
TO VERIFY
TRANSFERABLE
```

son estados válidos.

"No sé" es mejor que un CV falso.

---

# 14. Descubrimiento antes que encasillamiento

Las familias laborales conocidas ayudan a buscar, pero no son una lista cerrada.

Si Port encuentra un puesto inesperado con:

- alto fit;
- alta transferibilidad;
- pocos gaps;
- buen crecimiento;

debe mostrarlo aunque el título no aparezca en ninguna lista previa.

El sistema debe poder descubrir nuevas rutas profesionales.

---

# 15. Qué debería lograr Port cuando esté maduro

El resultado ideal de una corrida es pequeño y accionable:

```text
MAIN
1. oportunidad A
2. oportunidad B
3. oportunidad C

SIDE
1. oportunidad D
2. oportunidad E

Para cada una:
- por qué encaja
- evidencia
- gaps
- salario/modalidad
- potencial
- riesgos
- CV recomendado
```

Y, debajo de esa selección, debe conservarse el universo completo para revisión humana.

---

# Principio rector

> Port no intenta encontrar trabajos que se parezcan al trabajo actual.
>
> Intenta descubrir qué oportunidades reales puede alcanzar Ian ahora o mediante una transición razonable, y darle suficiente evidencia para decidir por sí mismo.
