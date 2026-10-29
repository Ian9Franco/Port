"""Bilingual base CVs. Reuses the approved monochrome layout and original assets."""
from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from pypdf import PdfReader
import build_cv_original_style as design

ROOT = Path(r'D:\.CodeProjects\Copenhagen')
OUT = ROOT / 'output' / 'pdf'
DATA = {
    'ES': {
        'filename': 'Ian Pontorno - CV Base - Espanol.pdf',
        'title': 'DESARROLLADOR DE SOFTWARE | FULL STACK',
        'labels': ('Teléfono', 'Email', 'Ubicación', 'GitHub', 'Portfolio'),
        'headings': ['PERFIL PROFESIONAL', 'HERRAMIENTAS Y TECNOLOGÍAS', 'EXPERIENCIA PROFESIONAL', 'PROYECTOS DE DESARROLLO', 'FORMACIÓN ACADÉMICA', 'CERTIFICACIONES'],
        'summary': 'Desarrollador de software con más de 3 años de experiencia en aplicaciones web, integración de APIs y automatización de procesos. Trabajo con React, TypeScript, Node.js, Python y bases de datos, desde el análisis de necesidades hasta el despliegue y mantenimiento. Desarrollo herramientas internas y reportes en colaboración con equipos Agile. Estudiante de Ingeniería en Software.',
        'skills': [
            '<b>Lenguajes:</b> TypeScript, JavaScript, Python, Java, SQL, Bash, SAP ABAP',
            '<b>Web y escritorio:</b> React, Next.js, Node.js, Electron, HTML, CSS, Tailwind CSS',
            '<b>Datos e integración:</b> APIs REST, PostgreSQL, MySQL, MongoDB, Supabase, Firebase',
            '<b>Infraestructura:</b> Git, GitHub Actions, CI/CD, Docker, AWS (EC2, S3), Linux',
            '<b>Prácticas y análisis:</b> POO, Agile Scrum, documentación, Power BI, Excel avanzado',
        ],
        'jobs': [
            ('Marketing Engineer (Paid Media & Automation)', 'Fanger Design - Buenos Aires, Argentina | 2025 - Presente', [
                'Desarrollo scripts para automatizar tareas operativas y mantengo sitios web y datos internos.',
                'Analizo y optimizo campañas de Google Ads y Meta Ads según los objetivos comerciales de cada cliente.',
            ]),
            ('IT Operations & Automation Specialist', 'Codere - Buenos Aires, Argentina | 2019 - 2025', [
                'Desarrollé aplicaciones internas con Python e integré APIs REST y bases de datos para reportes operativos.',
                'Automaticé tableros con Power BI y Excel; colaboré en despliegues AWS/Docker, soporte y documentación.',
            ]),
            ('Front-End Developer', 'Ilummi - Remoto | 2021 - 2025', [
                'Desarrollé aplicaciones con React y TypeScript, integrando APIs, MySQL y Firebase/Supabase.',
                'Construí dashboards con Recharts/D3.js y pipelines CI/CD con GitHub Actions y AWS en equipos Agile.',
            ]),
        ],
        'projects': [
            '<b><link href="https://github.com/Ian9Franco/MIM" color="#191919">MIM:</link></b> Diseñé una aplicación de escritorio y web con arquitectura modular basada en eventos, diagnóstico de fallos y sincronización de datos con soporte sin conexión. Desarrollo independiente, en beta. Electron, TypeScript, React, PostgreSQL.',
            '<b>Smart Scan:</b> Desarrollo un explorador de archivos con búsqueda semántica mediante IA local, indexación sin modificar los originales, vistas previas y conversión de formatos. TypeScript, Node.js.',
        ],
        'education': [
            '<b>Estudios de Ingeniería en Software (en curso)</b><br/><i>Universidad Nacional de La Matanza | 2023 - Presente</i>',
            '<b>Diploma en Programación SAP ABAP</b><br/><i>Universidad Tecnológica Nacional | 2025</i>',
        ],
    },
    'EN': {
        'filename': 'Ian Pontorno - Base Resume - English.pdf',
        'title': 'SOFTWARE DEVELOPER | FULL STACK',
        'labels': ('Phone', 'Email', 'Location', 'GitHub', 'Portfolio'),
        'headings': ['PROFESSIONAL SUMMARY', 'TOOLS & TECHNOLOGIES', 'PROFESSIONAL EXPERIENCE', 'SELECTED PROJECTS', 'EDUCATION', 'CERTIFICATIONS'],
        'summary': 'Software developer with 3+ years of experience in web applications, API integration and process automation. Hands-on experience with React, TypeScript, Node.js, Python and databases, from requirements analysis through deployment and maintenance. Background in internal tools, reporting and Agile teamwork. Currently pursuing software engineering studies.',
        'skills': [
            '<b>Languages:</b> TypeScript, JavaScript, Python, Java, SQL, Bash, SAP ABAP',
            '<b>Web & desktop:</b> React, Next.js, Node.js, Electron, HTML, CSS, Tailwind CSS',
            '<b>Data & integration:</b> REST APIs, PostgreSQL, MySQL, MongoDB, Supabase, Firebase',
            '<b>Infrastructure:</b> Git, GitHub Actions, CI/CD, Docker, AWS (EC2, S3), Linux',
            '<b>Practices & analytics:</b> OOP, Agile Scrum, documentation, Power BI, advanced Excel',
        ],
        'jobs': [
            ('Marketing Engineer (Paid Media & Automation)', 'Fanger Design - Buenos Aires, Argentina | 2025 - Present', [
                'Develop scripts to automate operational tasks and maintain websites and internal data.',
                'Analyze and optimize Google Ads and Meta Ads campaigns against each client\'s business objectives.',
            ]),
            ('IT Operations & Automation Specialist', 'Codere - Buenos Aires, Argentina | 2019 - 2025', [
                'Developed Python-based internal applications, integrating REST APIs and databases for operational reporting.',
                'Automated Power BI and Excel dashboards; supported AWS/Docker deployments, IT operations and documentation.',
            ]),
            ('Front-End Developer', 'Ilummi - Remote | 2021 - 2025', [
                'Built React and TypeScript applications, integrating APIs, MySQL and Firebase/Supabase.',
                'Created Recharts/D3.js dashboards and CI/CD pipelines with GitHub Actions and AWS in Agile teams.',
            ]),
        ],
        'projects': [
            '<b><link href="https://github.com/Ian9Franco/MIM" color="#191919">MIM:</link></b> Designed a desktop and web application with a modular, event-driven architecture, crash diagnosis and offline-first data synchronization. Independently developed, currently in beta. Electron, TypeScript, React, PostgreSQL.',
            '<b>Smart Scan:</b> Developing a file explorer with local AI-powered semantic search, indexing that preserves original files, multimedia previews and format conversion. TypeScript, Node.js.',
        ],
        'education': [
            '<b>Software Engineering Studies (in progress)</b><br/><i>Universidad Nacional de La Matanza | 2023 - Present</i>',
            '<b>Diploma in SAP ABAP Programming</b><br/><i>Universidad Tecnológica Nacional | 2025</i>',
        ],
    },
}


def build(lang):
    d = DATA[lang]
    regular, bold, italic, photo = design.extract_source_assets()
    design.register_fonts(regular, bold, italic)
    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / d['filename']
    c = canvas.Canvas(str(path), pagesize=(design.PAGE_W, design.PAGE_H), pageCompression=1)
    c.setTitle('Ian Pontorno - Software Developer - ' + lang)
    c.setAuthor('Ian Pontorno')
    c.setSubject('General software development resume')
    c.setFillColor(colors.white)
    c.rect(0, 0, design.PAGE_W, design.PAGE_H, fill=1, stroke=0)
    c.drawImage(str(photo), 29.25, 691.75, width=107.3, height=107.3, mask='auto')
    c.setStrokeColor(colors.HexColor('#333333'))
    c.setLineWidth(1.7)
    c.circle(82.9, 745.4, 53.65, fill=0, stroke=1)
    c.setFillColor(design.BLACK)
    c.setFont('RobotoMono-Bold', 12)
    c.drawString(148, 784.7, 'IAN PONTORNO')
    values = ['+54 11 6572-5420', 'ian9franco@gmail.com', 'Buenos Aires, Argentina', 'github.com/Ian9Franco', 'ian-pontorno-portfolio.vercel.app/']
    links = [None, 'mailto:ian9franco@gmail.com', None, 'https://github.com/Ian9Franco', 'https://ian-pontorno-portfolio.vercel.app/']
    for idx, (label, value, link) in enumerate(zip(d['labels'], values, links)):
        design.draw_header_line(c, 766.7 - idx * 18, label, value, link, italic=idx in (1, 3))

    body = design.paragraph_style(8.65, 11.3)
    small = design.paragraph_style(8.4, 10.8)

    def heading(y, label):
        return design.draw_divider_and_heading(c, y, label) - 2.0

    def para(text, y, style=body, x=39.5, width=515.5):
        return design.draw_paragraph(c, text, x, y, width, style)

    y = heading(684.2, d['headings'][0])
    y = para('<b>' + d['title'] + '</b>', y) - 3
    y = para(d['summary'], y)
    y = heading(y - 7, d['headings'][1])
    for skill in d['skills']:
        y = design.draw_bullet(c, skill, y, body)
    y = heading(y - 6, d['headings'][2])
    for idx, (role, employer, bullets) in enumerate(d['jobs']):
        y = para('<b>' + role + '</b>', y, x=34, width=521)
        y = para('<i>' + employer + '</i>', y, small, x=34, width=521) - 3
        for bullet in bullets:
            y = design.draw_bullet(c, bullet, y, body)
        if idx < 2:
            y -= 6
    y = heading(y - 6, d['headings'][3])
    for project in d['projects']:
        y = design.draw_bullet(c, project, y, small) - 1.5
    y = heading(y - 6, d['headings'][4])
    for idx, edu in enumerate(d['education']):
        y = para(edu, y, small, x=47, width=508)
        if idx == 0:
            y -= 4
    y = heading(y - 7, d['headings'][5])
    y = para('JavaScript Development · Advanced Backend Development · Java Development<br/>Data Analytics · Web Development · Fundamentals of Artificial Intelligence', y, design.paragraph_style(7.65, 10.6))
    if y < 30:
        raise RuntimeError(f'{lang}: content exceeds bottom margin: {y}')
    c.save()
    r = PdfReader(str(path))
    t = '\n'.join(p.extract_text() or '' for p in r.pages)
    assert len(r.pages) == 1 and '\x00' not in t
    print(f'{lang}: bottom={y:.1f}, pages={len(r.pages)}, chars={len(t)}, output={path}')


if __name__ == '__main__':
    for language in ('ES', 'EN'):
        build(language)
