import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadCareerModel } from "./load-career-model.mjs";

const APPLICATIONS_ROOT = "applications";
const COMPILE_STATUSES = new Set(["shortlisted", "prepared"]);

function slugify(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 72);
}

function applicationFolderName(job) {
  const base = slugify(`${job.company}-${job.title}`);
  const suffix = slugify(String(job.id).replace(/[^a-z0-9-]/gi, "")).slice(0, 14);
  return (base || "opportunity") + (suffix ? "-" + suffix : "");
}

function normalizedText(...parts) {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

function requirementSplit(job, matcherProfile) {
  const body = normalizedText(job.title, job.description, ...(job.tags ?? []));
  const required = (matcherProfile.requirement_terms ?? []).filter(term => body.includes(term.toLowerCase()));
  const known = matcherProfile.known_skills ?? [];
  const emphasize = required.filter(term =>
    known.some(skill => skill === term || skill.includes(term) || term.includes(skill))
  );
  const verify = required.filter(term => !emphasize.includes(term));
  return {
    emphasize: [...new Set(emphasize)],
    verify: [...new Set(verify)]
  };
}

function matchedCapabilities(job, careerModel) {
  const body = normalizedText(job.title, job.description, ...(job.tags ?? []));
  const capabilities = careerModel.github_evidence?.capabilities ?? [];
  return capabilities.filter(cap => {
    const terms = [cap.skill, ...(cap.match_terms ?? []), ...(cap.aliases ?? [])].map(t => t.toLowerCase());
    return terms.some(term => body.includes(term));
  });
}

function buildOpportunityMd(job, generatedAt) {
  return [
    "# Opportunity snapshot",
    "",
    "Compiled: " + generatedAt,
    "",
    "- **Title:** " + job.title,
    "- **Company:** " + job.company,
    "- **URL:** " + job.url,
    "- **Source:** " + job.source,
    "- **Status:** " + job.status,
    "- **Location:** " + (job.location || "—"),
    "- **Modality:** " + job.workplace + " · " + (job.remote ? "remote" : "onsite/hybrid"),
    "- **Employment type:** " + job.employment_type,
    "- **Salary (listing):** " + (job.salary || "not specified"),
    "",
    "## Description (excerpt)",
    "",
    (job.description || "_No description stored._").trim(),
    ""
  ].join("\n");
}

function buildFitAnalysisMd(job) {
  const p = job.potential ?? {};
  const t = job.trust ?? {};
  return [
    "# Fit analysis",
    "",
    "| Dimension | Value |",
    "| --- | --- |",
    "| Current Fit | " + (p.current_fit ?? "—") + " |",
    "| Transferability | " + (p.transferability ?? "—") + " |",
    "| Gap Cost | " + (p.gap_cost ?? "—") + " |",
    "| Evidence Confidence | " + (p.evidence_confidence ?? "—") + " |",
    "| Career Potential | " + (p.career_potential ?? "—") + " |",
    "| Relocation Value | " + (p.relocation_value ?? "—") + " |",
    "| Workstyle Fit | " + (p.workstyle_fit ?? "—") + " |",
    "| Commute Burden | " + (p.commute_burden ?? "—") + " |",
    "| MAIN rank | " + (job.main_score ?? "—") + " |",
    "| SIDE rank | " + (job.side_score ?? "—") + " |",
    "",
    "## Role families",
    "",
    (p.role_families?.length ? p.role_families.map(f => "- " + f).join("\n") : "- (none detected)"),
    "",
    "## Why Port surfaced this",
    "",
    ...(p.reasons?.length ? p.reasons.map(r => "- " + r) : ["- Manual review recommended."]),
    "",
    "## Trust",
    "",
    "- SOURCE TRUST: " + (t.source_trust ?? job.source_trust ?? "—"),
    "- COMPANY TRUST: " + (t.company_trust ?? "—"),
    "- LISTING RISK: " + (t.listing_risk ?? "—"),
    (t.warnings?.length ? "- Warnings: " + t.warnings.join(", ") : ""),
    ""
  ].join("\n");
}

function buildGapsMd(job) {
  const gaps = job.potential?.gaps ?? [];
  const lines = [
    "# Gaps",
    "",
    "Gaps are **missing or unverified requirements**, not automatic rejections.",
    ""
  ];

  if (!gaps.length) {
    lines.push("No structured gaps detected in the last matcher run.", "");
    return lines.join("\n");
  }

  lines.push("| Term | Type | Notes |", "| --- | --- | --- |");
  for (const gap of gaps) {
    const note =
      gap.type === "tool" ? "Often learnable if fundamentals transfer." :
      gap.type === "ecosystem" ? "Platform familiarity ramp." :
      gap.type === "operational" ? "Harder to substitute with study alone." :
      gap.type === "fundamental" ? "Verify honestly; may need experience path." : "Review listing.";
    lines.push("| " + gap.term + " | " + gap.type + " | " + note + " |");
  }

  lines.push(
    "",
    "## Before applying",
    "",
    "- Mark each gap as **UNKNOWN**, **TO VERIFY**, or **TRANSFERABLE** — never invent experience.",
    "- Prepare one sentence on how adjacent project evidence relates (if true).",
    ""
  );

  return lines.join("\n");
}

function buildCvMd(job, careerModel, req) {
  const employment = careerModel.employment_evidence ?? {};
  const assets = employment.assets ?? {};
  const caps = matchedCapabilities(job, careerModel);

  const lines = [
    "# CV lens (draft)",
    "",
    "_Same facts as master evidence; order and emphasis adapted to this role. Do not add employers, years, or tools that are not documented._",
    "",
    "## Summary",
    "",
    employment.positioning ?? "Growth Engineer & full-stack developer focused on automation, integrations, and product execution.",
    "",
    "Angle for **" + job.title + "** at **" + job.company + "**: connect shipped automation, integrations, and product work to the outcomes this listing describes — without overstating stack depth.",
    "",
    "## Emphasize (listing overlap)",
    ""
  ];

  if (req.emphasize.length) {
    for (const term of req.emphasize.slice(0, 14)) lines.push("- " + term);
  } else {
    lines.push("- General profile: automation, APIs, React/Next.js, integrations (verify against listing).");
  }

  lines.push("", "## Evidence-backed capabilities", "");

  if (caps.length) {
    for (const cap of caps.slice(0, 10)) {
      lines.push(
        "- **" + cap.skill + "** (" + cap.evidence_strength + ", " + cap.type + ") — sources: " +
        (cap.sources?.join(", ") || "see github-evidence.json")
      );
    }
  } else {
    lines.push("- Pull bullets from `career/github-evidence.json` after manual review.");
  }

  lines.push(
    "",
    "## Verify before claiming",
    "",
    req.verify.length ? req.verify.map(v => "- " + v).join("\n") : "- No extra keyword gaps flagged.",
    "",
    "## Links",
    "",
    "- Portfolio: " + (assets.portfolio_url || "—"),
    "- GitHub: " + (assets.github_url || "—"),
    "- Flagship: " + (assets.flagship_project || "MIM / FOMO Hub"),
    ""
  );

  return lines.join("\n");
}

function buildIntroMd(job, req) {
  const skills = req.emphasize.slice(0, 3).join(", ") || "automation and integrations";
  return [
    "# Short intro (email / DM)",
    "",
    "Hi — I'm Ian. Your **" + job.title + "** role stood out because it connects with work I do around **" + skills + "**.",
    "",
    "I focus on automation, API integrations, and full-stack product delivery (React/Next.js, internal tools, AI-assisted workflows). I'm careful to describe only what project evidence supports.",
    "",
    "Happy to share a tailored CV and walk through relevant work (e.g. MIM, integration-heavy apps) if useful.",
    "",
    "Link: " + (job.url),
    ""
  ].join("\n");
}

function buildCoverLetterMd(job, req, careerModel) {
  const assets = careerModel.employment_evidence?.assets ?? {};
  const skill1 = req.emphasize[0] || "automation";
  const skill2 = req.emphasize[1] || "integrations";
  const caps = matchedCapabilities(job, careerModel).slice(0, 2);

  return [
    "# Cover letter (draft)",
    "",
    "Hi hiring team,",
    "",
    "I'm applying for **" + job.title + "** at **" + job.company + "**.",
    "",
    "What caught my attention is the combination of **" + skill1 + "** and **" + skill2 + "** with clear implementation work — that's where I spend most of my time: connecting systems, removing manual steps, and shipping reliable product surfaces.",
    "",
    "Relevant evidence from my projects (not inflated):",
    caps.length
      ? caps.map(c => "- " + c.skill + " — " + (c.sources?.[0] || "see GitHub evidence")).join("\n")
      : "- Automation / integration / full-stack delivery — see portfolio and GitHub.",
    "",
    "I would start by clarifying the highest-value outcome for your team, then propose the smallest verifiable milestone before expanding scope.",
    "",
    "Portfolio: " + (assets.portfolio_url || "") + " · GitHub: " + (assets.github_url || ""),
    "",
    "Thank you for your time,",
    "Ian",
    ""
  ].join("\n");
}

function buildInterviewPrepMd(job, req) {
  const gaps = job.potential?.gaps ?? [];
  const families = job.potential?.role_families ?? [];

  const lines = [
    "# Interview prep",
    "",
    "## Likely questions (prepare honest answers)",
    ""
  ];

  for (const gap of gaps.slice(0, 5)) {
    lines.push("- How much hands-on experience do you have with **" + gap.term + "**? (Gap type: " + gap.type + ")");
  }

  if (!gaps.length) {
    lines.push("- Walk through a recent project end-to-end (problem → implementation → outcome).");
    lines.push("- How do you validate requirements when stacks are unfamiliar?");
  }

  lines.push(
    "",
    "## Questions to ask them",
    "",
    "- What does success look like in the first 90 days?",
    "- How much of the role is greenfield vs maintaining existing systems?",
    "- Team structure and collaboration expectations (async, on-call, stakeholder load).",
    families.includes("devops") ? "- What is the actual production ownership model (on-call, IaC, cloud)?" : "",
    "",
    "## Talking points (from matcher)",
    "",
    ...(job.potential?.reasons?.filter(r => r.startsWith("+")).slice(0, 6).map(r => "- " + r.slice(2)) ?? ["- Review fit-analysis.md reasons."]),
    "",
    "## Rules",
    "",
    "- Do not invent years, employers, certifications, or production scale.",
    "- UNKNOWN / TO VERIFY / TRANSFERABLE are valid states.",
    ""
  );

  return lines.filter(Boolean).join("\n");
}

async function writeBundle(dir, files) {
  await fs.mkdir(dir, { recursive: true });
  for (const [name, content] of Object.entries(files)) {
    await fs.writeFile(path.join(dir, name), content.endsWith("\n") ? content : content + "\n");
  }
}

/**
 * Compile application folders for shortlisted / prepared opportunities.
 */
export async function compileShortlistedApplications(opportunities, context, options = {}) {
  const { careerModel, matcherProfile, generatedAt } = context;
  const { force = false } = options;
  const compiled = [];

  for (const job of opportunities) {
    if (!force && !COMPILE_STATUSES.has(job.status)) continue;

    const folder = applicationFolderName(job);
    const dir = path.join(APPLICATIONS_ROOT, folder);
    const req = requirementSplit(job, matcherProfile);

    const files = {
      "opportunity.md": buildOpportunityMd(job, generatedAt),
      "fit-analysis.md": buildFitAnalysisMd(job),
      "gaps.md": buildGapsMd(job),
      "cv.md": buildCvMd(job, careerModel, req),
      "intro.md": buildIntroMd(job, req),
      "cover-letter.md": buildCoverLetterMd(job, req, careerModel),
      "interview-prep.md": buildInterviewPrepMd(job, req)
    };

    await writeBundle(dir, files);
    compiled.push({
      opportunity_id: job.id,
      folder,
      title: job.title,
      company: job.company,
      status: job.status,
      compiled_at: generatedAt
    });
  }

  await fs.mkdir(APPLICATIONS_ROOT, { recursive: true });
  await fs.writeFile(
    path.join(APPLICATIONS_ROOT, "manifest.json"),
    JSON.stringify({ generated_at: generatedAt, applications: compiled }, null, 2) + "\n"
  );

  return compiled;
}

async function runCli() {
  const id = process.argv[2];
  const data = JSON.parse(await fs.readFile("data/opportunities.json", "utf8"));
  const careerModel = await loadCareerModel();
  const matcherProfile = careerModel.matcher_profile;
  const generatedAt = new Date().toISOString();

  let list = data.opportunities ?? [];
  if (id) {
    list = list.filter(job => job.id === id);
    if (!list.length) {
      console.error("Opportunity not found: " + id);
      process.exit(1);
    }
  } else {
    list = list.filter(job => COMPILE_STATUSES.has(job.status));
  }

  const compiled = await compileShortlistedApplications(
    list,
    { careerModel, matcherProfile, generatedAt },
    { force: Boolean(id) }
  );

  console.log("Compiled " + compiled.length + " application bundle(s).");
}

const isCli = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isCli) {
  runCli().catch(error => {
    console.error(error);
    process.exit(1);
  });
}
