import os
import glob
from bs4 import BeautifulSoup

DOMAIN = "https://ibero.education"

# Bespoke Extreme SEO Data for each specific page
SEO_DATA = {
    "": {
        "title": "Centro Iberoamericano (IBERO) | Educación Executive e Inteligencia Artificial",
        "description": "Líderes en Educación Executive. Transforma tu carrera con el Centro Iberoamericano. Domina la Inteligencia Artificial, Marketing Digital y Negocios en tiempo récord.",
        "keywords": "educación executive, inteligencia artificial, marketing digital, negocios, ibero, centro iberoamericano, diplomados, programa ejecutivo, executive master program"
    },
    "artes-liberales": {
        "title": "Artes Liberales | Pensamiento Crítico e Innovación | IBERO",
        "description": "Estudia Artes Liberales en IBERO. Desarrolla pensamiento crítico, creatividad y liderazgo para resolver desafíos globales del mundo actual.",
        "keywords": "artes liberales, pensamiento crítico, humanidades, innovación, liderazgo, educación, ibero"
    },
    "ayuda-financiera": {
        "title": "Ayuda Financiera y Becas | Educación Accesible | IBERO",
        "description": "Conoce nuestras opciones de ayuda financiera, becas de excelencia y crédito directo sin intereses. El talento no tiene barreras en el Centro Iberoamericano.",
        "keywords": "ayuda financiera, becas, crédito directo, financiamiento estudiantil, becas ibero, educación accesible"
    },
    "calendario-academico": {
        "title": "Calendario Académico 2026 | Fechas de Inicio | IBERO",
        "description": "Consulta el Calendario Académico 2026 de IBERO. Fechas de inicio, inscripciones y duración de todos nuestros Executive Masters, Diplomados y Certificaciones.",
        "keywords": "calendario académico, fechas inicio clases, inscripciones, cronograma ibero 2026, matriculación"
    },
    "certificaciones-intensivas": {
        "title": "Certificaciones y Cursos Intensivos | IA y Negocios | IBERO",
        "description": "Certificaciones intensivas en Inteligencia Artificial, Marketing y Liderazgo. Acelera tu carrera y adquiere habilidades prácticas aplicables al instante.",
        "keywords": "certificaciones intensivas, cursos cortos, cursos inteligencia artificial, capacitación ejecutiva, ibero"
    },
    "comunicacion-efectiva": {
        "title": "Certificación en Comunicación Efectiva | Hablar en Público | IBERO",
        "description": "Domina el arte de hablar en público con nuestra certificación presencial en Comunicación Efectiva. Proyecta liderazgo y mejora tu persuasión escénica.",
        "keywords": "comunicación efectiva, hablar en público, oratoria, persuasión, liderazgo escénico, curso oratoria"
    },
    "consultoría-en-educación": {
        "title": "Consultoría en Educación y Diseño Curricular | IBERO B2B",
        "description": "Servicios B2B de consultoría académica: diseño de mallas curriculares, estrategias de comunicación e integración de IA para instituciones educativas.",
        "keywords": "consultoría en educación, diseño curricular, educación b2b, asesoría académica, innovación educativa"
    },
    "contacto": {
        "title": "Contacto y Soporte | Habla con un Asesor | IBERO",
        "description": "Ponte en contacto con el Centro Iberoamericano. Resuelve tus dudas sobre admisiones, programas académicos y becas con nuestro equipo de asesores.",
        "keywords": "contacto ibero, teléfono ibero, soporte admisiones, información académica, atención al estudiante"
    },
    "crea-tu-academia": {
        "title": "Certificación Crea tu Curso Online y Monetiza | IBERO",
        "description": "Diseña, estructura y lanza tu propio curso online con ayuda de la Inteligencia Artificial. Monetiza tu conocimiento en 4 días intensivos.",
        "keywords": "crear curso online, monetizar conocimiento, educación digital, inteligencia artificial para educadores, certificación"
    },
    "diplomado-ia-negocios-marketing": {
        "title": "Diplomado IA en Negocios y Marketing Digital | IBERO",
        "description": "Aprende a escalar negocios reales con este Diplomado en IA Aplicada. Automatización, Vibe Coding y estrategias de marketing de vanguardia en 5 semanas.",
        "keywords": "diplomado ia, inteligencia artificial negocios, ia marketing digital, vibe coding, automatización de negocios"
    },
    "diplomados-intensivos": {
        "title": "Diplomados Ejecutivos Intensivos | Transformación | IBERO",
        "description": "Inmersión ejecutiva total. Descubre nuestros diplomados en IA, negocios e innovación diseñados para transformar tu carrera profesional en tiempo récord.",
        "keywords": "diplomados intensivos, diplomados ejecutivos, formación profesional, inteligencia artificial, liderazgo"
    },
    "english-courses": {
        "title": "Cursos de Inglés Business & Tech | Idiomas | IBERO",
        "description": "Domina el idioma de los negocios e impulsa tu perfil global. Inglés Business & Tech diseñado para profesionales y ejecutivos exigentes.",
        "keywords": "inglés de negocios, english courses, inglés para ejecutivos, business english, aprender inglés tech"
    },
    "executive-master": {
        "title": "Executive Masters | Posgrados de Élite en IA | IBERO",
        "description": "Programas de alto nivel ejecutivo. Da el siguiente paso con nuestros Executive Masters en Inteligencia Artificial aplicada a los negocios.",
        "keywords": "executive master, programa ejecutivo, programas ejecutivos en ia, educación de élite, centro iberoamericano"
    },
    "goatify": {
        "title": "GOATIFY | Tecnología y Desarrollo de Software | IBERO",
        "description": "Conoce GOATIFY, el laboratorio de ingeniería y desarrollo de software del Centro Iberoamericano. Construimos plataformas con propósito e IA.",
        "keywords": "goatify, desarrollo de software, laboratorio de ingeniería, inteligencia artificial, tecnología ibero"
    },
    "ibero-academy": {
        "title": "IBERO Academy | Programas Académicos Virtuales | IBERO",
        "description": "Transforma tu futuro 100% online con IBERO Academy. Mentorías, orientación vocacional y programas a distancia adaptados a tu ritmo.",
        "keywords": "ibero academy, educación online, mentorías, campus virtual, cursos a distancia"
    },
    "ibero-labs": {
        "title": "IBERO Labs | Incubadora de Startups y Negocios | IBERO",
        "description": "Tu atajo al éxito emprendedor. Crea, valida y lanza tu startup integrando la potencia de la Inteligencia Artificial con IBERO Labs.",
        "keywords": "ibero labs, incubadora de empresas, startups, emprendimiento, lanzamiento de negocios, ia"
    },
    "marketing-digital-con-ia": {
        "title": "Certificación Marketing Digital con IA | Estrategia | IBERO",
        "description": "12 horas intensivas para dominar el Marketing Digital con IA. Construye, automatiza y monetiza tu presencia web sin improvisaciones.",
        "keywords": "marketing digital con ia, curso marketing digital, estrategia online, inteligencia artificial, automatización"
    },
    "master-ejecutivo-ia": {
        "title": "Executive Master IA Aplicada a Negocios y Marketing | IBERO",
        "description": "Incubación ejecutiva de 6 meses. Sistematiza y escala empresas reales dominando la Inteligencia Artificial, arquitectura digital y Vibe Coding.",
        "keywords": "master ia, executive master inteligencia artificial, negocios ia, programa ejecutivo marketing digital, automatización"
    },
    "metodologia": {
        "title": "Metodología IBERO 360° | Cómo Enseñamos | IBERO",
        "description": "Conoce nuestra metodología práctica, estratégica y tecnológica. Evaluamos proyectos reales, no exámenes de memoria. Educación con impacto.",
        "keywords": "metodología ibero, sistema de enseñanza, educación práctica, proyectos reales, aprendizaje 360"
    },
    "oferta-academica": {
        "title": "Oferta Académica | Catálogo de Cursos y Maestrias | IBERO",
        "description": "Explora nuestro catálogo completo. Masters Ejecutivos, Diplomados, Certificaciones y programas diseñados para dominar el mercado con IA.",
        "keywords": "oferta académica, catálogo de cursos, carreras ibero, programas ejecutivos, educación superior"
    },
    "publicaciones": {
        "title": "Publicaciones y Artículos | Investigación Médica y IA | IBERO",
        "description": "Nuestros insights. Explora artículos, investigaciones y noticias sobre tecnología, educación e Inteligencia Artificial creados por nuestros expertos.",
        "keywords": "publicaciones ibero, artículos tecnología, investigación académica, blog educación, noticias ia"
    },
    "registro-y-admisiones": {
        "title": "Registro y Admisiones | Postula a IBERO",
        "description": "Conoce el proceso de inscripción y requisitos de admisión para formar parte de la élite académica en el Centro Iberoamericano. Empieza tu postulación hoy.",
        "keywords": "admisiones ibero, proceso de inscripción, matriculación, postular a ibero, requisitos de ingreso"
    },
    "trabaja-con-nosotros": {
        "title": "Trabaja con Nosotros | Sé Parte de IBERO | Vacantes",
        "description": "Únete a nuestro claustro docente o forma parte del equipo administrativo y tecnológico de IBERO. Buscamos talento que aporte valor educativo.",
        "keywords": "trabajar en ibero, bolsa de empleo, vacantes educación, unirse al claustro, profesores ibero"
    }
}

DEFAULT_OG_IMAGE = f"{DOMAIN}/fotos/og-image.jpg"

def fix_links(soup, filepath):
    """Deeply inspect and correct links"""
    for a in soup.find_all("a", href=True):
        href = a["href"].strip()
        
        # Ignorar mailto, tel, anclas puras o links externos que no sean Ibero
        if href.startswith(("mailto:", "tel:", "#")):
            continue
            
        # Fix missing slashes on pure directory internal links
        # If it's something like "https://ibero.education/publicaciones" it should be "https://ibero.education/publicaciones/"
        if "ibero.education" in href:
            # We must be careful not to append trailing slash to specific files or parameters
            base_href = href.split("?")[0].split("#")[0]
            if not base_href.endswith("/") and not base_href.endswith(".html") and not base_href.endswith(".jpg") and not base_href.endswith(".pdf"):
                a["href"] = href.replace(base_href, base_href + "/")
                
        # Fix root relative links like "/publicaciones" -> "/publicaciones/"
        elif href.startswith("/"):
            base_href = href.split("?")[0].split("#")[0]
            if not base_href.endswith("/") and "." not in base_href:
                a["href"] = href.replace(base_href, base_href + "/")

        # Remove hardcoded .html files for root links inside internal logic
        if href in ["oferta-academica.html", "certificaciones.html", "diplomados-ejecutivos.html", "executive-masters.html", "ingles-continuo.html", "index.html"]:
            folder = href.replace(".html", "")
            if folder == "index":
                a["href"] = "/"
            elif folder == "certificaciones":
                a["href"] = "/certificaciones-intensivas/"
            elif folder == "diplomados-ejecutivos":
                a["href"] = "/diplomados-intensivos/"
            elif folder == "executive-masters":
                a["href"] = "/executive-master/"
            elif folder == "ingles-continuo":
                a["href"] = "/english-courses/"
            else:
                a["href"] = f"/{folder}/"

def apply_extreme_seo(filepath):
    dirname = os.path.dirname(filepath).replace("\\", "/")
    
    # Get the rich SEO data
    seo = SEO_DATA.get(dirname)
    if not seo:
        seo = SEO_DATA[""] # Falback
        
    canonical_url = f"{DOMAIN}/" if dirname == "" else f"{DOMAIN}/{dirname}/"
    
    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    head = soup.head
    if not head:
        head = soup.new_tag("head")
        soup.html.insert(0, head)

    # TITLE
    title_tag = head.find("title")
    if not title_tag:
        title_tag = soup.new_tag("title")
        head.append(title_tag)
    title_tag.string = seo["title"]

    # META DESCRIPTION
    desc_tag = head.find("meta", attrs={"name": "description"})
    if not desc_tag:
        desc_tag = soup.new_tag("meta", attrs={"name": "description"})
        head.append(desc_tag)
    desc_tag["content"] = seo["description"]

    # META KEYWORDS
    keys_tag = head.find("meta", attrs={"name": "keywords"})
    if not keys_tag:
        keys_tag = soup.new_tag("meta", attrs={"name": "keywords"})
        head.append(keys_tag)
    keys_tag["content"] = seo["keywords"]
    
    # META ROBOTS / AUTHOR
    robots_tag = head.find("meta", attrs={"name": "robots"})
    if not robots_tag:
        robots_tag = soup.new_tag("meta", attrs={"name": "robots", "content": "index, follow"})
        head.append(robots_tag)
        
    author_tag = head.find("meta", attrs={"name": "author"})
    if not author_tag:
        author_tag = soup.new_tag("meta", attrs={"name": "author", "content": "Centro Iberoamericano (IBERO)"})
        head.append(author_tag)

    # CANONICAL
    canonical_tag = head.find("link", rel="canonical")
    if canonical_tag:
        canonical_tag["href"] = canonical_url
    else:
        canonical_tag = soup.new_tag("link", rel="canonical", href=canonical_url)
        head.append(canonical_tag)

    # OPEN GRAPH
    og_data = {
        "og:title": seo["title"],
        "og:description": seo["description"],
        "og:url": canonical_url,
        "og:type": "website",
        "og:image": DEFAULT_OG_IMAGE,
        "og:locale": "es_ES",
        "og:site_name": "Centro Iberoamericano"
    }

    for prop, content in og_data.items():
        og_tag = head.find("meta", property=prop)
        if og_tag:
            og_tag["content"] = content
        else:
            og_tag = soup.new_tag("meta", property=prop, content=content)
            head.append(og_tag)

    fix_links(soup, filepath)

    with open(filepath, "w", encoding="utf-8") as f:
        # Prevent bs4 from injecting unwanted namespaces or altering formatting too much
        f.write(soup.prettify(formatter="html"))

def main():
    html_files = glob.glob("**/*.html", recursive=True)
    for filepath in html_files:
        apply_extreme_seo(filepath)
        print(f"Bespoke SEO and Link Verification applied to {filepath}")

if __name__ == "__main__":
    main()
