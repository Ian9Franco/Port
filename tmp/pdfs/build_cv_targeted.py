from pathlib import Path

from PIL import Image as PILImage, ImageDraw, ImageOps
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    HRFlowable,
    Image,
    KeepTogether,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(r"D:\.CodeProjects\Copenhagen")
SOURCE_RENDER = ROOT / "tmp" / "pdfs" / "ian-pontorno-current" / "page-1.png"
WORK_DIR = ROOT / "tmp" / "pdfs" / "ian-pontorno-targeted"
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PDF = OUTPUT_DIR / "Ian Pontorno - Analista Programador SSr.pdf"
PHOTO_PATH = WORK_DIR / "profile-photo.png"


def prepare_photo() -> None:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    source = PILImage.open(SOURCE_RENDER).convert("RGB")
    # The source PDF is A4 rendered at 144 dpi. This box contains the original headshot.
    photo = source.crop((54, 66, 279, 291))
    photo = ImageOps.fit(photo, (600, 600), method=PILImage.Resampling.LANCZOS)

    mask = PILImage.new("L", (600, 600), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, 599, 599), fill=255)

    framed = PILImage.new("RGBA", (616, 616), (255, 255, 255, 0))
    ring = PILImage.new("L", (616, 616), 0)
    ImageDraw.Draw(ring).ellipse((0, 0, 615, 615), fill=255)
    framed.paste((27, 127, 121, 255), (0, 0), ring)
    framed.paste(photo.convert("RGBA"), (8, 8), mask)
    framed.save(PHOTO_PATH)


def register_fonts() -> None:
    fonts = Path(r"C:\Windows\Fonts")
    pdfmetrics.registerFont(TTFont("Arial", fonts / "arial.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Bold", fonts / "arialbd.ttf"))
    pdfmetrics.registerFont(TTFont("Arial-Italic", fonts / "ariali.ttf"))


NAVY = colors.HexColor("#16324F")
TEAL = colors.HexColor("#1B7F79")
INK = colors.HexColor("#17212B")
MUTED = colors.HexColor("#53606D")
PALE = colors.HexColor("#EAF3F2")
LINE = colors.HexColor("#CBD7DE")


def section_heading(label: str, styles: dict) -> KeepTogether:
    return KeepTogether(
        [
            Spacer(1, 2.2 * mm),
            Paragraph(label.upper(), styles["section"]),
            HRFlowable(width="100%", thickness=0.7, color=TEAL, spaceBefore=1.2, spaceAfter=3.8),
        ]
    )


def bullet(text: str, styles: dict) -> Paragraph:
    return Paragraph(f"- {text}", styles["bullet"])


def job_block(role: str, employer: str, dates: str, bullets: list[str], styles: dict) -> KeepTogether:
    heading = Table(
        [[Paragraph(role, styles["job_role"]), Paragraph(dates, styles["job_dates"])]],
        colWidths=[132 * mm, 42 * mm],
        hAlign="LEFT",
    )
    heading.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, 0), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    items = [heading, Paragraph(employer, styles["employer"]), Spacer(1, 1.1 * mm)]
    items.extend(bullet(item, styles) for item in bullets)
    return KeepTogether(items)


def build_pdf() -> None:
    prepare_photo()
    register_fonts()
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        rightMargin=16 * mm,
        leftMargin=16 * mm,
        topMargin=12 * mm,
        bottomMargin=10 * mm,
        title="Ian Pontorno - Analista Programador SSr",
        author="Ian Pontorno",
        subject="CV adaptado para una posición de Analista Programador SSr",
    )

    sample = getSampleStyleSheet()
    styles = {
        "name": ParagraphStyle(
            "Name",
            parent=sample["Normal"],
            fontName="Arial-Bold",
            fontSize=20,
            leading=22,
            textColor=NAVY,
            spaceAfter=1.2 * mm,
        ),
        "target": ParagraphStyle(
            "Target",
            parent=sample["Normal"],
            fontName="Arial-Bold",
            fontSize=10.2,
            leading=12,
            textColor=TEAL,
            spaceAfter=2.2 * mm,
        ),
        "contact": ParagraphStyle(
            "Contact",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.1,
            leading=10.6,
            textColor=MUTED,
        ),
        "section": ParagraphStyle(
            "Section",
            parent=sample["Normal"],
            fontName="Arial-Bold",
            fontSize=9.5,
            leading=11,
            textColor=NAVY,
            tracking=0.4,
        ),
        "body": ParagraphStyle(
            "Body",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.9,
            leading=11.8,
            textColor=INK,
            alignment=TA_LEFT,
        ),
        "skill": ParagraphStyle(
            "Skill",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.45,
            leading=10.9,
            textColor=INK,
        ),
        "job_role": ParagraphStyle(
            "JobRole",
            parent=sample["Normal"],
            fontName="Arial-Bold",
            fontSize=9.15,
            leading=10.8,
            textColor=INK,
        ),
        "job_dates": ParagraphStyle(
            "JobDates",
            parent=sample["Normal"],
            fontName="Arial-Bold",
            fontSize=8.0,
            leading=10,
            textColor=TEAL,
        ),
        "employer": ParagraphStyle(
            "Employer",
            parent=sample["Normal"],
            fontName="Arial-Italic",
            fontSize=8.0,
            leading=9.7,
            textColor=MUTED,
        ),
        "bullet": ParagraphStyle(
            "Bullet",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.15,
            leading=10.45,
            leftIndent=4.2 * mm,
            firstLineIndent=-3.2 * mm,
            textColor=INK,
            spaceAfter=0.8 * mm,
        ),
        "education": ParagraphStyle(
            "Education",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.45,
            leading=10.8,
            textColor=INK,
        ),
        "cert": ParagraphStyle(
            "Cert",
            parent=sample["Normal"],
            fontName="Arial",
            fontSize=8.05,
            leading=9.8,
            textColor=INK,
        ),
    }

    photo = Image(str(PHOTO_PATH), width=31 * mm, height=31 * mm)
    header_text = [
        Paragraph("IAN PONTORNO", styles["name"]),
        Paragraph("ANALISTA PROGRAMADOR SSR | PYTHON · SQL · APIS REST · AUTOMATIZACIÓN", styles["target"]),
        Table(
            [
                [
                    Paragraph("Buenos Aires, Argentina<br/>+54 11 6572-5420", styles["contact"]),
                    Paragraph(
                        '<link href="mailto:ian9franco@gmail.com" color="#53606D">ian9franco@gmail.com</link><br/>'
                        '<link href="https://github.com/Ian9Franco" color="#53606D">github.com/Ian9Franco</link>',
                        styles["contact"],
                    ),
                    Paragraph(
                        '<link href="https://ian-pontorno-portfolio.vercel.app/" color="#53606D">Portfolio profesional</link><br/>'
                        "Modalidad presencial / híbrida",
                        styles["contact"],
                    ),
                ]
            ],
            colWidths=[51 * mm, 58 * mm, 50 * mm],
        ),
    ]
    header = Table([[photo, header_text]], colWidths=[36 * mm, 138 * mm], hAlign="LEFT")
    header.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )

    story = [header]
    story.append(section_heading("Perfil profesional", styles))
    story.append(
        Paragraph(
            "Desarrollador de software y automatización con más de 3 años de experiencia en aplicaciones internas, "
            "integraciones y soluciones orientadas a datos. Trabajo con Python, SQL, APIs REST, Git y desarrollo web, "
            "cubriendo análisis de necesidades, diseño, implementación, despliegue, documentación y soporte. Perfil "
            "proactivo y responsable, orientado a buenas prácticas, mantenibilidad y mejora continua.",
            styles["body"],
        )
    )

    story.append(section_heading("Competencias técnicas", styles))
    skill_cells = [
        [
            Paragraph("<b>Desarrollo:</b> Python, JavaScript, TypeScript, Java, programación orientada a objetos", styles["skill"]),
            Paragraph("<b>Backend y APIs:</b> Node.js, APIs REST, Postman", styles["skill"]),
        ],
        [
            Paragraph("<b>Datos:</b> SQL, MySQL, MongoDB, Firebase, Supabase", styles["skill"]),
            Paragraph("<b>Automatización:</b> Bash, Docker, GitHub Actions, CI/CD, Linux", styles["skill"]),
        ],
        [
            Paragraph("<b>Cloud y reporting:</b> AWS (EC2, S3), Power BI, Excel avanzado", styles["skill"]),
            Paragraph("<b>Prácticas:</b> Git, Agile Scrum, documentación técnica, mantenimiento correctivo y evolutivo", styles["skill"]),
        ],
        [
            Paragraph("<b>Frontend complementario:</b> React, Next.js, Tailwind CSS, HTML5, CSS3", styles["skill"]),
            Paragraph("<b>Herramientas:</b> Jira, ServiceNow, VS Code, GitHub", styles["skill"]),
        ],
    ]
    skills_table = Table(skill_cells, colWidths=[87 * mm, 87 * mm], hAlign="LEFT")
    skills_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), PALE),
                ("BOX", (0, 0), (-1, -1), 0.5, LINE),
                ("INNERGRID", (0, 0), (-1, -1), 0.35, colors.white),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 6),
                ("RIGHTPADDING", (0, 0), (-1, -1), 6),
                ("TOPPADDING", (0, 0), (-1, -1), 4.2),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 4.2),
            ]
        )
    )
    story.append(skills_table)

    story.append(section_heading("Experiencia profesional", styles))
    story.append(
        job_block(
            "IT Operations & Automation Specialist",
            "Codere · Buenos Aires, Argentina",
            "2019 - Presente",
            [
                "Analicé necesidades de usuarios y procesos operativos para traducirlas en herramientas internas y automatizaciones con Python y Bash.",
                "Diseñé, desarrollé y mantuve aplicaciones para carga, validación, reporting y seguimiento de datos.",
                "Automaticé tableros y reportes con SQL, Excel avanzado y Power BI para el seguimiento de KPIs.",
                "Atendí incidentes y realicé mantenimiento correctivo y evolutivo de aplicaciones, software, hardware y redes.",
                "Documenté procedimientos técnicos y funcionales, gestioné usuarios y aseguré la integridad de los datos.",
                "Colaboré en el despliegue y monitoreo de aplicaciones con AWS y Docker.",
            ],
            styles,
        )
    )
    story.append(Spacer(1, 1.7 * mm))
    story.append(
        job_block(
            "Frontend Data Engineer",
            "Illumi Digital y proyectos personales · Remoto",
            "2022 - 2025",
            [
                "Desarrollé y mantuve aplicaciones web orientadas a datos con React, Next.js y TypeScript.",
                "Integré APIs REST y bases de datos SQL, Firebase y Supabase para dashboards y flujos de información.",
                "Construí componentes reutilizables con Recharts y D3.js, priorizando mantenibilidad y rendimiento.",
                "Automaticé despliegues con GitHub Actions y AWS; trabajé con Git y prácticas CI/CD.",
                "Colaboré en equipos Agile, entregando soluciones accesibles y de alto rendimiento.",
            ],
            styles,
        )
    )

    story.append(section_heading("Formación académica", styles))
    education_table = Table(
        [
            [
                Paragraph("<b>Licenciatura en Ingeniería de Software</b> (en curso)<br/>Universidad Nacional de La Matanza", styles["education"]),
                Paragraph("<b>2023 - Presente</b>", styles["education"]),
            ],
            [
                Paragraph("<b>Diploma en SAP ABAP</b> (en curso)<br/>Universidad Tecnológica Nacional", styles["education"]),
                Paragraph("<b>Desde 2025</b>", styles["education"]),
            ],
        ],
        colWidths=[145 * mm, 29 * mm],
        hAlign="LEFT",
    )
    education_table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("ALIGN", (1, 0), (1, -1), "RIGHT"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 0),
                ("TOPPADDING", (0, 0), (-1, -1), 0.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 2.5),
            ]
        )
    )
    story.append(education_table)

    story.append(section_heading("Certificaciones", styles))
    certs = Table(
        [
            [
                Paragraph("- Advanced Backend Development<br/>- Java Development", styles["cert"]),
                Paragraph("- JavaScript Development<br/>- Web Development", styles["cert"]),
                Paragraph("- Data Analytics<br/>- Fundamentals of Artificial Intelligence", styles["cert"]),
            ]
        ],
        colWidths=[58 * mm, 58 * mm, 58 * mm],
        hAlign="LEFT",
    )
    certs.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 0),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 0),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 0),
            ]
        )
    )
    story.append(certs)

    def draw_page(canvas, document):
        canvas.saveState()
        canvas.setStrokeColor(LINE)
        canvas.setLineWidth(0.45)
        canvas.line(16 * mm, 7.5 * mm, A4[0] - 16 * mm, 7.5 * mm)
        canvas.setFont("Arial", 6.7)
        canvas.setFillColor(MUTED)
        canvas.drawRightString(A4[0] - 16 * mm, 4.6 * mm, "Ian Pontorno | Buenos Aires, Argentina")
        canvas.restoreState()

    doc.build(story, onFirstPage=draw_page, onLaterPages=draw_page)

    reader = PdfReader(str(OUTPUT_PDF))
    if len(reader.pages) != 1:
        raise RuntimeError(f"El CV debe ocupar una página; se generaron {len(reader.pages)} páginas")


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PDF)
