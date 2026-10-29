from io import BytesIO
from pathlib import Path

from PIL import Image as PILImage, ImageDraw, ImageOps
from pypdf import PdfReader
from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.styles import ParagraphStyle
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas
from reportlab.platypus import Paragraph


ROOT = Path(r"D:\.CodeProjects\Copenhagen")
SOURCE_PDF = ROOT / "cv" / "Ian Pontorno.pdf"
WORK_DIR = ROOT / "tmp" / "pdfs" / "ian-pontorno-original-style"
OUTPUT_DIR = ROOT / "output" / "pdf"
OUTPUT_PDF = OUTPUT_DIR / "Ian Pontorno - Analista Programador SSr.pdf"
FONT_DIR = WORK_DIR / "fonts"

PAGE_W = 595.5
PAGE_H = 842.25
BLACK = colors.HexColor("#191919")
LINK_BLUE = colors.HexColor("#0000EE")


def extract_source_assets() -> tuple[Path, Path, Path, Path]:
    WORK_DIR.mkdir(parents=True, exist_ok=True)
    photo_path = WORK_DIR / "profile-photo.png"
    if not photo_path.exists():
        reader = PdfReader(str(SOURCE_PDF))
        form = reader.pages[0]["/Resources"]["/XObject"]["/X20"]
        resources = form["/Resources"]
        image_stream = resources["/XObject"]["/X9"]
        photo = PILImage.open(BytesIO(image_stream.get_data())).convert("RGB")
        photo = ImageOps.fit(photo, (900, 900), method=PILImage.Resampling.LANCZOS)
        mask = PILImage.new("L", (900, 900), 0)
        ImageDraw.Draw(mask).ellipse((0, 0, 899, 899), fill=255)
        circular = PILImage.new("RGBA", (900, 900), (255, 255, 255, 0))
        circular.paste(photo.convert("RGBA"), (0, 0), mask)
        circular.save(photo_path)
    regular = FONT_DIR / "RobotoMono-Regular.ttf"
    bold = FONT_DIR / "RobotoMono-Bold.ttf"
    italic = FONT_DIR / "RobotoMono-Italic.ttf"
    for font_path in (regular, bold, italic):
        if not font_path.exists():
            raise FileNotFoundError(f"Missing full Roboto Mono font: {font_path}")
    return regular, bold, italic, photo_path


def register_fonts(regular: Path, bold: Path, italic: Path) -> None:
    pdfmetrics.registerFont(TTFont("RobotoMono", str(regular)))
    pdfmetrics.registerFont(TTFont("RobotoMono-Bold", str(bold)))
    pdfmetrics.registerFont(TTFont("RobotoMono-Italic", str(italic)))
    pdfmetrics.registerFontFamily(
        "RobotoMono",
        normal="RobotoMono",
        bold="RobotoMono-Bold",
        italic="RobotoMono-Italic",
        boldItalic="RobotoMono-Bold",
    )


def paragraph_style(font_size: float = 9.17, leading: float = 12.3, font_name: str = "RobotoMono") -> ParagraphStyle:
    return ParagraphStyle(
        "Inline",
        fontName=font_name,
        fontSize=font_size,
        leading=leading,
        textColor=BLACK,
        alignment=TA_LEFT,
        spaceAfter=0,
        spaceBefore=0,
    )


def draw_paragraph(c: canvas.Canvas, html: str, x: float, y_top: float, width: float, style: ParagraphStyle) -> float:
    para = Paragraph(html, style)
    _, height = para.wrap(width, PAGE_H)
    para.drawOn(c, x, y_top - height)
    return y_top - height


def draw_divider_and_heading(c: canvas.Canvas, y: float, label: str) -> float:
    c.setFillColor(BLACK)
    c.circle(29.5, y, 1.35, stroke=0, fill=1)
    c.setStrokeColor(BLACK)
    c.setLineWidth(0.72)
    c.line(31.8, y, 555.0, y)
    c.setFont("RobotoMono-Bold", 10.0)
    c.drawString(34.0, y - 14.0, label)
    return y - 22.0


def draw_vector_bullet(c: canvas.Canvas, y_top: float, x: float = 39.5) -> None:
    c.setFillColor(BLACK)
    c.circle(x, y_top - 5.7, 1.35, stroke=0, fill=1)


def draw_bullet(c: canvas.Canvas, html: str, y: float, style: ParagraphStyle, width: float = 503.0) -> float:
    draw_vector_bullet(c, y)
    return draw_paragraph(c, html, 49.5, y, width, style) - 1.1


def draw_header_line(c: canvas.Canvas, y: float, label: str, value: str, link: str | None = None, italic: bool = False) -> None:
    x = 148.0
    c.setFillColor(BLACK)
    c.setFont("RobotoMono-Bold", 12.0)
    label_text = f"{label}:"
    c.drawString(x, y, label_text)
    value_x = x + pdfmetrics.stringWidth(label_text + " ", "RobotoMono-Bold", 12.0)
    font_name = "RobotoMono-Italic" if italic else "RobotoMono"
    c.setFont(font_name, 12.0)
    c.drawString(value_x, y, value)
    if link:
        value_width = pdfmetrics.stringWidth(value, font_name, 12.0)
        c.setLineWidth(0.65)
        c.line(value_x, y - 1.3, value_x + value_width, y - 1.3)
        c.linkURL(link, (value_x, y - 2.5, value_x + value_width, y + 11.0), relative=0)


def build_pdf() -> None:
    regular, bold, italic, photo_path = extract_source_assets()
    register_fonts(regular, bold, italic)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    c = canvas.Canvas(str(OUTPUT_PDF), pagesize=(PAGE_W, PAGE_H), pageCompression=1)
    c.setTitle("IAN PONTORNO - Analista Programador SSr")
    c.setAuthor("Ian Pontorno")
    c.setSubject("Curriculum vitae adaptado para Analista Programador SSr")
    c.setFillColor(colors.white)
    c.rect(0, 0, PAGE_W, PAGE_H, stroke=0, fill=1)

    # Header and headshot: same placement and monochrome treatment as the source PDF.
    photo_x, photo_y, photo_size = 29.25, 691.75, 107.3
    c.drawImage(str(photo_path), photo_x, photo_y, width=photo_size, height=photo_size, mask="auto")
    c.setStrokeColor(colors.HexColor("#333333"))
    c.setLineWidth(1.7)
    c.circle(photo_x + photo_size / 2, photo_y + photo_size / 2, photo_size / 2, stroke=1, fill=0)

    c.setFillColor(BLACK)
    c.setFont("RobotoMono-Bold", 12.0)
    c.drawString(148.0, 784.7, "IAN PONTORNO")
    draw_header_line(c, 766.7, "Teléfono", "+54 11 6572-5420")
    draw_header_line(c, 748.7, "Email", "ian9franco@gmail.com", "mailto:ian9franco@gmail.com", italic=True)
    draw_header_line(c, 730.7, "Ubicación", "Buenos Aires, Argentina")
    draw_header_line(c, 712.7, "GitHub", "github.com/Ian9Franco", "https://github.com/Ian9Franco", italic=True)
    draw_header_line(
        c,
        694.7,
        "Portfolio",
        "ian-pontorno-portfolio.vercel.app/",
        "https://ian-pontorno-portfolio.vercel.app/",
    )

    body = paragraph_style(9.17, 12.35)
    bullet_style = paragraph_style(9.17, 12.35)
    education_style = paragraph_style(9.17, 11.9)

    y = draw_divider_and_heading(c, 684.2, "RESUMEN PROFESIONAL")
    y = draw_paragraph(
        c,
        "Ingeniero en Software con +3 años de experiencia en desarrollo web, automatización y soluciones orientadas a datos. "
        "Trabajo con Python, SQL, APIs REST, Git y aplicaciones web, participando en el análisis, desarrollo, despliegue y soporte de "
        "soluciones. Experiencia en mantenimiento correctivo y evolutivo, documentación técnica y mejora continua. Perfil proactivo, "
        "responsable y orientado a buenas prácticas y software mantenible.",
        39.5,
        y,
        515.5,
        body,
    )

    y = draw_divider_and_heading(c, y - 5.5, "HERRAMIENTAS Y TECNOLOGÍAS")
    skills = [
        "<b>Lenguajes:</b> Python, JavaScript, TypeScript, Java, Bash, SQL",
        "<b>Desarrollo:</b> Programación orientada a objetos, React, Next.js, Node.js",
        "<b>Backend y Datos:</b> APIs REST, Postman, MySQL, MongoDB, Firebase/Supabase",
        "<b>Automatización y DevOps:</b> Docker, GitHub Actions, CI/CD, Linux, AWS (EC2, S3)",
        "<b>Analítica y Reporting:</b> Power BI, Excel avanzado, Google Sheets API",
        "<b>Herramientas:</b> Git, Jira, ServiceNow, VS Code",
        "<b>Metodologías:</b> Agile Scrum, documentación técnica, buenas prácticas de desarrollo",
    ]
    for item in skills:
        y = draw_bullet(c, item, y, bullet_style)

    y = draw_divider_and_heading(c, y - 4.8, "EXPERIENCIA PROFESIONAL")
    y -= 8.0
    c.setFillColor(BLACK)
    c.setFont("RobotoMono-Bold", 9.17)
    c.drawString(34.0, y, "IT Operations & Automation Specialist")
    y -= 12.1
    c.setFont("RobotoMono-Italic", 9.17)
    c.drawString(34.0, y, "Codere - Buenos Aires, Argentina | 2019 - Presente")
    y -= 12.6
    codere_bullets = [
        "Analicé necesidades de usuarios y procesos para desarrollar herramientas internas y automatizaciones con Python y Bash.",
        "Diseñé y mantuve aplicaciones para carga de datos, reportes y seguimiento de procesos.",
        "Atendí incidentes y realicé mantenimiento correctivo y evolutivo de aplicaciones y sistemas.",
        "Automaticé reportes con SQL, Excel y Power BI para el seguimiento de KPIs.",
        "Colaboré en despliegue y monitoreo de aplicaciones con AWS y Docker.",
        "Documenté procesos técnicos y funcionales, y aseguré la integridad de los datos.",
    ]
    for item in codere_bullets:
        y = draw_bullet(c, item, y, bullet_style)

    y -= 10.5
    c.setFont("RobotoMono-Bold", 9.17)
    c.drawString(34.0, y, "Frontend Data Engineer")
    y -= 12.1
    c.setFont("RobotoMono-Italic", 9.17)
    c.drawString(34.0, y, "Illumi Digital & Proyectos Personales - Remoto | 2022 - 2025")
    y -= 12.6
    frontend_bullets = [
        "Desarrollé y mantuve aplicaciones web orientadas a datos con React, Next.js y TypeScript.",
        "Integré APIs REST y bases de datos SQL, Firebase/Supabase para dashboards.",
        "Construí componentes reutilizables, priorizando mantenibilidad y rendimiento.",
        "Automaticé despliegues con GitHub Actions y AWS, trabajando con Git y CI/CD.",
        "Colaboré en equipos Agile, documentando soluciones y realizando entregas iterativas.",
    ]
    for item in frontend_bullets:
        y = draw_bullet(c, item, y, bullet_style)

    y = draw_divider_and_heading(c, y - 5.2, "FORMACIÓN ACADÉMICA")
    y = draw_paragraph(
        c,
        "<b>Licenciatura en Ingeniería en Software (en curso)</b><br/>"
        "<i>- Universidad Nacional de La Matanza (2023 - Presente)</i>",
        47.0,
        y,
        508.0,
        education_style,
    ) - 3.0
    y = draw_paragraph(
        c,
        "<b>Diploma en SAP ABAP</b><br/>"
        "<i>- Universidad Tecnológica Nacional (2025)</i>",
        47.0,
        y,
        508.0,
        education_style,
    )

    y = draw_divider_and_heading(c, y - 5.0, "CERTIFICACIONES")
    y -= 6.0
    cert_font = "RobotoMono-Bold"
    cert_size = 7.86
    c.setFillColor(BLACK)
    c.setFont(cert_font, cert_size)
    left = ["Javascript Development", "Advance Backend Development", "Java Development"]
    right = ["Data Analytics", "Web Development", "Fundamentals of Artificial Intelligence"]
    for row, (left_text, right_text) in enumerate(zip(left, right)):
        baseline = y - row * 12.7
        for x, text in ((47.0, left_text), (318.0, right_text)):
            c.circle(x, baseline + 2.6, 1.25, stroke=0, fill=1)
            text_x = x + 11.0
            c.drawString(text_x, baseline, text)

    c.save()

    reader = PdfReader(str(OUTPUT_PDF))
    if len(reader.pages) != 1:
        raise RuntimeError(f"Expected one page, got {len(reader.pages)}")


if __name__ == "__main__":
    build_pdf()
    print(OUTPUT_PDF)
