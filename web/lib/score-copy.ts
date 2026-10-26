import type { PortOpportunity } from "./port-data";

export type ReadoutRow = {
  id: string;
  label: string;
  value: string;
  meaning: string;
  unknown: string | null;
};

const EMPLOYMENT: Record<string, string> = {
  full_time: "tiempo completo",
  part_time: "tiempo parcial",
  contract: "contrato",
  freelance: "freelance",
  internship: "pasantía",
  temporary: "temporal"
};

const WORKPLACE: Record<string, string> = {
  remote: "remoto",
  hybrid: "híbrido",
  onsite: "presencial"
};

const ACCESS: Record<string, string> = {
  "remote-now": "remoto compatible con Argentina",
  "remote-unclear": "remoto sin país claro",
  "local-onsite": "presencial o híbrido en Argentina",
  "relocation-watch": "España o Valencia, para más adelante",
  "foreign-onsite": "presencial en otro país",
  "restricted-remote": "remoto que no incluye Argentina ni España"
};

const GAP_TYPE: Record<string, { label: string; meaning: string }> = {
  tool: {
    label: "herramienta",
    meaning: "No está en la evidencia. A veces se aprende si la base transfiere; igual no la afirmes."
  },
  ecosystem: {
    label: "ecosistema",
    meaning: "Producto o plataforma. Familiarizarse lleva más que un tutorial."
  },
  operational: {
    label: "operativo",
    meaning: "Práctica de operación. Estudiar no reemplaza haberlo hecho."
  },
  fundamental: {
    label: "fundamental",
    meaning: "Hueco de fondo. No afirmes esa experiencia."
  },
  unknown: {
    label: "desconocido",
    meaning: "El requisito no se leyó, el texto está cortado, o no se pudo nombrar."
  }
};

const GAP_COST: Record<string, string> = {
  low: "bajo",
  medium: "medio",
  high: "alto",
  unknown: "desconocido"
};

const CONFIDENCE: Record<string, string> = {
  low: "baja",
  medium: "media",
  high: "alta"
};

function yesNo(value: boolean | undefined): string {
  if (value === true) return "sí";
  if (value === false) return "no";
  return "desconocido";
}

function stored(value: string | number | null | undefined, empty: string): string {
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  if (typeof value === "string" && value.trim()) return value.trim();
  return empty;
}

export function gapRows(job: PortOpportunity): { term: string; typeLabel: string; meaning: string }[] {
  return (job.potential?.gaps ?? []).map(gap => {
    const known = GAP_TYPE[gap.type];
    return {
      term: gap.term,
      typeLabel: known?.label ?? gap.type,
      meaning: known?.meaning ?? "Tipo de hueco sin glosa en la interfaz."
    };
  });
}

export function gapsUnknownNote(job: PortOpportunity): string | null {
  const gaps = job.potential?.gaps ?? [];
  if (!gaps.length) {
    return "No hay huecos marcados. Eso no prueba que el aviso cierre: la lista de requisitos puede no haberse leído.";
  }
  if (job.potential?.requirements_status === "unread" || job.description_truncated) {
    return "Hay huecos desconocidos porque el texto obligatorio no se leyó o la descripción está cortada.";
  }
  return null;
}

export function listingRows(job: PortOpportunity): ReadoutRow[] {
  const employment = job.employment_type?.trim() ?? "";
  const workplace = job.workplace?.trim() ?? "";
  const modality = [
    workplace ? (WORKPLACE[workplace] ?? workplace) : "",
    job.remote === true ? "marca remote: sí" : job.remote === false ? "marca remote: no" : ""
  ].filter(Boolean).join(" · ");

  return [
    {
      id: "seniority",
      label: "Seniority del aviso",
      value: stored(job.seniority, "no indicado"),
      meaning: "Lo que pide el aviso. La evidencia de proyectos y cursos no confirma seniority profesional.",
      unknown: job.seniority?.trim() ? null : "El aviso no guarda nivel."
    },
    {
      id: "employment",
      label: "Tipo de empleo",
      value: employment ? (EMPLOYMENT[employment] ?? employment) : "no indicado",
      meaning: "Modalidad contractual guardada por el radar.",
      unknown: employment ? null : "El aviso no guarda tipo de empleo."
    },
    {
      id: "modality",
      label: "Lugar de trabajo",
      value: modality || "no indicado",
      meaning: "Remoto, híbrido o presencial según el board. No es una promesa de visa.",
      unknown: modality ? null : "El aviso no guarda modalidad."
    }
  ];
}

export function scoreRows(job: PortOpportunity): ReadoutRow[] {
  const potential = job.potential;
  const unread = potential?.requirements_status === "unread";
  const truncated = job.description_truncated === true;
  const fitUnknown = [
    unread ? "Los requisitos obligatorios no se leyeron. Si el número es 40, es un techo, no un encaje real." : "",
    truncated ? "La descripción guardada está cortada." : "",
    potential?.current_fit == null ? "Esta ficha no trae encaje." : ""
  ].filter(Boolean).join(" ");

  const gapCost = potential?.gap_cost;
  const confidence = potential?.evidence_confidence;

  return [
    {
      id: "main",
      label: "Ranking MAIN",
      value: stored(job.main_score, "no guardado"),
      meaning: "Orden de la pista principal en esta corrida: reemplazar o mejorar el empleo. Más alto sube en la lista. No es una probabilidad de contratación ni de poder hacer el trabajo.",
      unknown: job.main_score == null
        ? "Esta ficha no trae ranking MAIN."
        : unread
          ? "El orden usa un encaje con techo porque los requisitos no se leyeron."
          : null
    },
    {
      id: "side",
      label: "Ranking SIDE",
      value: stored(job.side_score, "no guardado"),
      meaning: "Orden de la pista de ingreso extra. Pide remoto compatible con zona oeste. Tampoco es una probabilidad.",
      unknown: job.side_score == null ? "Esta ficha no trae ranking SIDE." : null
    },
    {
      id: "fit",
      label: "Encaje actual",
      value: stored(potential?.current_fit, "no guardado"),
      meaning: "De 0 a 100, requisitos obligatorios que cubre evidencia directa o laboral. Si la lista no se leyó, el radar no pasa de 40.",
      unknown: fitUnknown || null
    },
    {
      id: "transfer",
      label: "Transferibilidad",
      value: stored(potential?.transferability, "no guardada"),
      meaning: "De 0 a 100, cuánto de lo reconocido en el texto se apoya en evidencia directa o transferible. No mide años ni seniority.",
      unknown: potential?.transferability == null ? "Esta ficha no trae transferibilidad." : null
    },
    {
      id: "potential",
      label: "Potencial de carrera",
      value: stored(potential?.career_potential, "no guardado"),
      meaning: "De 0 a 100, cercanía a familias de rol del modelo. No promete crecimiento ni un puesto senior.",
      unknown: potential?.career_potential == null ? "Esta ficha no trae potencial." : null
    },
    {
      id: "gap-cost",
      label: "Costo del hueco",
      value: gapCost ? (GAP_COST[gapCost] ?? gapCost) : "no guardado",
      meaning: "Qué tan caro es cerrar huecos concretos. Bajo: herramienta chica. Medio: rampa. Alto: práctica que no se estudia en unos días.",
      unknown: !gapCost || gapCost === "unknown"
        ? "No se pudo estimar. Pasa cuando los requisitos no se leyeron, la descripción está cortada, o no hay huecos concretos."
        : null
    },
    {
      id: "evidence",
      label: "Confianza de la evidencia",
      value: confidence ? (CONFIDENCE[confidence] ?? confidence) : "no guardada",
      meaning: "Si la autoevaluación calibró la profundidad. Baja suele querer decir que varias herramientas siguen sin verificar.",
      unknown: !confidence
        ? "Esta ficha no trae confianza de evidencia."
        : confidence === "low"
          ? "La profundidad de varias herramientas sigue sin confirmar."
          : null
    },
    {
      id: "salary",
      label: "Salario",
      value: job.salary?.trim() ? job.salary.trim() : "no publicado",
      meaning: potential?.compensation_note?.trim()
        || "No hay nota de comparación guardada. Otra moneda no se compara con el piso en pesos.",
      unknown: "Bruto o neto: desconocido. Un monto en otra moneda no se resta del piso en pesos."
    }
  ];
}

export function placeRows(job: PortOpportunity): ReadoutRow[] {
  const potential = job.potential;
  const access = job.access?.trim() ?? "";
  return [
    {
      id: "zona-oeste",
      label: "Desde zona oeste ahora",
      value: yesNo(potential?.work_from_zona_oeste),
      meaning: "Marca del radar a partir del texto del lugar. No confirma visa, contrato ni que el empleador acepte.",
      unknown: potential?.work_from_zona_oeste == null ? "La ficha no trae esta marca." : null
    },
    {
      id: "valencia",
      label: "Después de Valencia",
      value: yesNo(potential?.work_after_valencia),
      meaning: "Marca del radar: si el mismo aviso seguiría siendo posible viviendo en Valencia. Europa genérica no cuenta como España.",
      unknown: potential?.work_after_valencia == null ? "La ficha no trae esta marca." : null
    },
    {
      id: "bridge",
      label: "Puente",
      value: yesNo(potential?.place_bridge),
      meaning: "Sí solo cuando las dos marcas anteriores son sí: sirve ahora y sigue siendo posible después de la mudanza.",
      unknown: potential?.place_bridge == null ? "La ficha no trae esta marca." : null
    },
    {
      id: "access",
      label: "Clase de lugar",
      value: access ? (ACCESS[access] ?? access) : "no guardada",
      meaning: "remote-now: Argentina. relocation-watch: España o Valencia, más adelante. restricted-remote: no incluye Argentina ni España.",
      unknown: access ? null : "La ficha no trae la clase de lugar."
    },
    {
      id: "move",
      label: "Fecha de mudanza",
      value: potential?.move_window === "unknown" || !potential?.move_window ? "sin fecha" : potential.move_window,
      meaning: "Hasta que haya una fecha dicha por Ian, este aviso no se ordena como si el viaje fuera pronto.",
      unknown: !potential?.move_window || potential.move_window === "unknown" ? "La ventana de mudanza es desconocida." : null
    },
    {
      id: "commute",
      label: "Viaje",
      value: potential?.commute_note?.trim() || "sin nota",
      meaning: "El origen es zona oeste, Buenos Aires. Sin municipio no hay kilómetros.",
      unknown: potential?.commute_km == null ? "Distancia no calculada. No se inventa un municipio." : null
    }
  ];
}

export function formatRows(rows: ReadoutRow[]): string {
  return rows.map(row => {
    const unknown = row.unknown ? `\n  Desconocido: ${row.unknown}` : "";
    return `- ${row.label}: ${row.value}\n  Qué significa: ${row.meaning}${unknown}`;
  }).join("\n");
}
