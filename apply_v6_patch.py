from pathlib import Path
from bs4 import BeautifulSoup
import json, re, html, datetime

ROOT = Path(__file__).resolve().parent
TODAY = '2026-07-02'
SITE = 'https://ibero.education'
ORG = {
    '@type': 'EducationalOrganization',
    '@id': SITE + '/#organization',
    'name': 'Centro IBEROamericano',
    'alternateName': ['IBERO', 'Centro Iberoamericano de Educación'],
    'url': SITE + '/',
    'logo': SITE + '/fotos/logos%20ibero/ibero-favicon.svg',
    'sameAs': [SITE + '/'],
    'areaServed': [
        {'@type': 'Country', 'name': 'Ecuador'},
        {'@type': 'Country', 'name': 'México'},
        {'@type': 'Country', 'name': 'Colombia'},
        {'@type': 'Country', 'name': 'Perú'},
        {'@type': 'AdministrativeArea', 'name': 'Latinoamérica'}
    ],
    'knowsAbout': [
        'inteligencia artificial aplicada', 'desarrollo de aplicaciones con IA', 'productos digitales',
        'marketing digital con IA', 'docencia con IA', 'oratoria profesional', 'negocios digitales',
        'automatización comercial', 'apps web', 'PWA', 'MVP'
    ],
    'address': {
        '@type': 'PostalAddress',
        'addressLocality': 'Quito',
        'addressRegion': 'Pichincha',
        'addressCountry': 'EC'
    }
}

PROGRAMS = {
    'marketing-digital-con-ia': {
        'url': SITE + '/marketing-digital-con-ia/',
        'commercial': 'Marketing Digital con IA',
        'formal': 'Certificado en Marketing Digital con Inteligencia Artificial',
        'shortFormal': 'Marketing Digital con Inteligencia Artificial',
        'typeLabel': 'CERTIFICADO',
        'title': 'Certificado en Marketing Digital con Inteligencia Artificial | IBERO',
        'description': 'Certificación intensiva de 12 horas para aplicar inteligencia artificial en marketing digital, contenidos, embudos, Meta Ads, CRM, automatización y venta de productos, servicios o marcas.',
        'start': '2026-07-27', 'end': '2026-07-30', 'hours': 12, 'price_usd': '57',
        'prices': {'USD':'57','MXN':'995','PEN':'200','COP':'211000'},
        'audience': 'emprendedores, profesionales, marcas, creadores y negocios que quieren vender mejor con IA',
        'teaches': ['marketing digital con IA', 'embudos', 'contenido', 'Meta Ads', 'CRM', 'automatización comercial', 'activos digitales'],
        'mode': 'online',
        'differentiator': 'Ayuda a vender mejor lo que la persona ya ofrece o está creando: marca, servicio, producto, curso, app o negocio.'
    },
    'ia-para-docentes': {
        'url': SITE + '/ia-para-docentes/',
        'commercial': 'IA para Docentes',
        'formal': 'Certificado en Inteligencia Artificial Aplicada a la Docencia',
        'shortFormal': 'Inteligencia Artificial Aplicada a la Docencia',
        'typeLabel': 'CERTIFICADO',
        'title': 'Certificado en Inteligencia Artificial Aplicada a la Docencia | IBERO',
        'description': 'Certificación intensiva de 12 horas para docentes, formadores y capacitadores que quieren aplicar IA en planificación, recursos, evaluación, productividad y experiencias de aprendizaje.',
        'start': '2026-08-03', 'end': '2026-08-06', 'hours': 12, 'price_usd': '57',
        'prices': {'USD':'57','MXN':'995','PEN':'200','COP':'211000'},
        'audience': 'docentes, formadores, capacitadores, instituciones educativas y profesionales de la educación',
        'teaches': ['IA aplicada a la docencia', 'planificación didáctica', 'evaluación con IA', 'recursos educativos', 'productividad docente'],
        'mode': 'online',
        'differentiator': 'Convierte la IA en una herramienta práctica para planificar, enseñar, evaluar y producir mejores experiencias educativas.'
    },
    'monetiza-tu-idea': {
        'url': SITE + '/monetiza-tu-idea/',
        'commercial': 'Vende tu App y Consigue Clientes',
        'formal': 'Certificado en Gestión de Producto Digital y Estrategia con Inteligencia Artificial',
        'shortFormal': 'Gestión de Producto Digital y Estrategia con Inteligencia Artificial',
        'typeLabel': 'CERTIFICADO',
        'title': 'Certificado en Gestión de Producto Digital y Estrategia con IA | IBERO',
        'description': 'Curso intensivo de 12 horas para convertir una app, MVP, software, automatización o prototipo creado con IA en un producto digital claro, presentable y listo para salir al mercado.',
        'start': '2026-08-10', 'end': '2026-08-13', 'hours': 12, 'price_usd': '57',
        'prices': {'USD':'57','MXN':'995','PEN':'200','COP':'211000'},
        'audience': 'personas que ya tienen o están terminando una app, MVP, software, automatización o producto digital y necesitan ordenarlo para venderlo',
        'teaches': ['gestión de producto digital', 'estrategia con IA', 'propuesta de valor', 'landing', 'demo', 'cliente ideal', 'pricing', 'captación de clientes'],
        'mode': 'online',
        'differentiator': 'No se queda en vender por vender: ordena el producto digital, la propuesta, la demo y la estrategia para salir a mercado.'
    },
    'crea-tu-academia': {
        'url': SITE + '/crea-tu-academia/',
        'commercial': 'Crea tu Curso Online y Monetiza',
        'formal': 'Certificado en Diseño y Producción de Cursos Online con Inteligencia Artificial',
        'shortFormal': 'Diseño y Producción de Cursos Online con Inteligencia Artificial',
        'typeLabel': 'CERTIFICADO',
        'title': 'Certificado en Diseño y Producción de Cursos Online con IA | IBERO',
        'description': 'Certificación intensiva de 12 horas para estructurar, producir y lanzar cursos online con IA: contenido, experiencia de aprendizaje, materiales, oferta, página y monetización.',
        'start': '2026-08-17', 'end': '2026-08-20', 'hours': 12, 'price_usd': '57',
        'prices': {'USD':'57','MXN':'995','PEN':'200','COP':'211000'},
        'audience': 'expertos, docentes, coaches, consultores, creadores y profesionales que quieren convertir su conocimiento en un curso online',
        'teaches': ['diseño instruccional', 'producción de cursos online', 'IA para contenidos', 'estructura de programa', 'monetización de conocimiento'],
        'mode': 'online',
        'differentiator': 'Transforma conocimiento en un curso online estructurado, producible y vendible, no solo en clases sueltas.'
    },
    'comunicacion-efectiva': {
        'url': SITE + '/comunicacion-efectiva/',
        'commercial': 'Aprende a Hablar en Público',
        'formal': 'Certificado en Comunicación Efectiva y Oratoria Profesional',
        'shortFormal': 'Comunicación Efectiva y Oratoria Profesional',
        'typeLabel': 'CERTIFICADO',
        'title': 'Certificado en Comunicación Efectiva y Oratoria Profesional | IBERO',
        'description': 'Taller presencial para hablar en público con claridad, seguridad, estructura, storytelling y presencia profesional aplicada a ventas, docencia, liderazgo y presentaciones.',
        'start': '2026-08-08', 'end': '2026-08-08', 'hours': 4, 'price_usd': '57',
        'prices': {'USD':'57','MXN':'995','PEN':'200','COP':'211000'},
        'audience': 'personas que necesitan presentar, enseñar, vender, liderar, grabar video o comunicar ideas con seguridad',
        'teaches': ['oratoria profesional', 'comunicación efectiva', 'storytelling', 'presencia escénica', 'persuasión', 'seguridad al hablar'],
        'mode': 'presencial',
        'differentiator': 'Fortalece la capacidad de explicar, vender, enseñar y liderar con presencia real frente a otras personas.'
    },
    'diplomado-ia-negocios-marketing': {
        'url': SITE + '/diplomado-ia-negocios-marketing/',
        'commercial': 'Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con IA',
        'formal': 'Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con Inteligencia Artificial',
        'shortFormal': 'Desarrollo de Aplicaciones y Gestión de Productos Digitales con Inteligencia Artificial',
        'typeLabel': 'DIPLOMADO',
        'title': 'Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con IA | IBERO',
        'description': 'Diplomado de 5 semanas y 60 horas para desarrollar aplicaciones, apps web, PWAs o MVPs con IA y gestionar productos digitales con estrategia, UX, landing, CRM, automatización, marketing y lanzamiento.',
        'start': '2026-10-05', 'end': '2026-11-05', 'hours': 60, 'price_usd': '277',
        'prices': {'USD':'277','MXN':'4850','PEN':'975','COP':'1025000'},
        'audience': 'personas que quieren construir, mejorar, lanzar y organizar una aplicación, MVP o producto digital desde un proceso guiado de 5 semanas',
        'teaches': ['desarrollo de aplicaciones con IA', 'gestión de productos digitales', 'MVP', 'UX', 'vibe coding', 'landing', 'CRM', 'automatización', 'lanzamiento', 'Demo Day'],
        'mode': 'online',
        'differentiator': 'A diferencia del certificado corto, aquí el participante trabaja durante 5 semanas el desarrollo, validación, presentación y lanzamiento de un producto digital completo.'
    },
    'master-ejecutivo-ia': {
        'url': SITE + '/master-ejecutivo-ia/',
        'commercial': 'Máster Ejecutivo en IA Aplicada y Dirección de Productos Digitales',
        'formal': 'Máster Ejecutivo en Inteligencia Artificial Aplicada y Dirección de Productos Digitales',
        'shortFormal': 'Inteligencia Artificial Aplicada y Dirección de Productos Digitales',
        'typeLabel': 'MÁSTER EJECUTIVO',
        'title': 'Máster Ejecutivo en IA Aplicada y Dirección de Productos Digitales | IBERO',
        'description': 'Máster Ejecutivo de 6 meses y 234 horas para dirigir productos digitales, apps, automatizaciones y negocios con inteligencia artificial aplicada, estrategia, marketing, ventas, operación y escalamiento.',
        'start': '2026-10-19', 'end': '2027-04-30', 'hours': 234, 'price_usd': '926.25',
        'prices': {'USD':'926.25','MXN':'16191','PEN':'3251','COP':'3423420'},
        'audience': 'emprendedores, directores, consultores y profesionales que quieren dirigir productos digitales, implementar IA aplicada y construir sistemas de negocio escalables',
        'teaches': ['inteligencia artificial aplicada', 'dirección de productos digitales', 'estrategia tecnológica', 'apps', 'negocios digitales', 'marketing', 'ventas', 'automatización', 'métricas', 'liderazgo'],
        'mode': 'online',
        'differentiator': 'Es el nivel ejecutivo: no solo crea una app, sino que dirige productos digitales, equipos, sistemas comerciales y escalamiento con IA.'
    },
    'executive-master': None,
}
PROGRAMS['executive-master'] = dict(PROGRAMS['master-ejecutivo-ia'], url=SITE + '/executive-master/')

# Global, visible naming cleanup. Slugs remain untouched.
REPLACEMENTS = [
    ('Executive Master Program en IA, Apps y Negocios Digitales', 'Máster Ejecutivo en IA Aplicada y Dirección de Productos Digitales'),
    ('Executive Master Program en IA, Apps y Negocios', 'Máster Ejecutivo en IA Aplicada y Dirección de Productos Digitales'),
    ('EXECUTIVE MASTER PROGRAM EN IA, APPS Y NEGOCIOS DIGITALES', 'MÁSTER EJECUTIVO EN IA APLICADA Y DIRECCIÓN DE PRODUCTOS DIGITALES'),
    ('EXECUTIVE MASTER PROGRAM EN IA, APPS Y NEGOCIOS', 'MÁSTER EJECUTIVO EN IA APLICADA Y DIRECCIÓN DE PRODUCTOS DIGITALES'),
    ('Executive Master Programs', 'Másteres Ejecutivos'),
    ('EXECUTIVE MASTER PROGRAMS', 'MÁSTERES EJECUTIVOS'),
    ('Executive Master Program', 'Máster Ejecutivo'),
    ('EXECUTIVE MASTER PROGRAM', 'MÁSTER EJECUTIVO'),
    ('Master Ejecutivo', 'Máster Ejecutivo'),
    ('Masteres Ejecutivos', 'Másteres Ejecutivos'),
    ('Diplomado Ejecutivo en Desarrollo y Venta de Apps con IA Aplicada', 'Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con IA'),
    ('Diplomado Ejecutivo en Desarrollo y Venta de Apps con IA', 'Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con IA'),
    ('DIPLOMADO EJECUTIVO EN DESARROLLO Y VENTA DE APPS CON IA APLICADA', 'DIPLOMADO EN DESARROLLO DE APLICACIONES Y GESTIÓN DE PRODUCTOS DIGITALES CON IA'),
    ('DIPLOMADO EJECUTIVO EN DESARROLLO Y VENTA DE APPS CON IA', 'DIPLOMADO EN DESARROLLO DE APLICACIONES Y GESTIÓN DE PRODUCTOS DIGITALES CON IA'),
    ('Diplomado Ejecutivo de 5 semanas', 'Diplomado de 5 semanas'),
    ('Diplomado Ejecutivo 5 semanas', 'Diplomado 5 semanas'),
    ('Diplomado Ejecutivo', 'Diplomado'),
    ('Diplomados Ejecutivos', 'Diplomados'),
    ('Diplomados ejecutivos', 'Diplomados'),
    ('Credencial Executive IBERO', 'Máster Ejecutivo IBERO'),
    ('Credencial Executive', 'Máster Ejecutivo'),
    ('Certificación Global', 'Máster Ejecutivo'),
    ('AI & Digital Business Strategist', 'Inteligencia Artificial Aplicada y Dirección de Productos Digitales'),
    ('Certificación en Venta y Monetización de Apps con IA', 'Certificado en Gestión de Producto Digital y Estrategia con Inteligencia Artificial'),
    ('Venta y Monetización de Apps con IA', 'Gestión de Producto Digital y Estrategia con IA'),
    ('Credencial: Gestión de Producto Digital y Estrategia con IA', 'Certificado: Gestión de Producto Digital y Estrategia con IA'),
    ('Certificación Marketing Digital con IA, Embudos y Activos Digitales', 'Certificado en Marketing Digital con Inteligencia Artificial'),
    ('Certificación IA para Docentes', 'Certificado en Inteligencia Artificial Aplicada a la Docencia'),
    ('Certificación en Comunicación Efectiva', 'Certificado en Comunicación Efectiva y Oratoria Profesional'),
    ('Certificación Crea tu Curso Online y Monetiza', 'Certificado en Diseño y Producción de Cursos Online con IA'),
]

# Fix text in every HTML and JS file.
for p in list(ROOT.rglob('*.html')) + list(ROOT.rglob('*.js')) + list(ROOT.rglob('*.txt')):
    txt = p.read_text(encoding='utf-8', errors='ignore')
    old = txt
    for a,b in REPLACEMENTS:
        txt = txt.replace(a,b)
    # Naturalize master after global replacements in code/search keys.
    txt = txt.replace("if (related === 'master' || title.includes('MÁSTER EJECUTIVO')) return 'master';", "if (related === 'master' || title.includes('MÁSTER EJECUTIVO') || title.includes('MASTER EJECUTIVO') || title.includes('EXECUTIVE MASTER')) return 'master';")
    txt = txt.replace("if (t.includes('MÁSTER EJECUTIVO')) return '⚫';", "if (t.includes('MÁSTER EJECUTIVO') || t.includes('MASTER EJECUTIVO') || t.includes('EXECUTIVE MASTER')) return '⚫';")
    txt = txt.replace("if (title.includes('MÁSTER EJECUTIVO')) return 'prog-master';", "if (title.includes('MÁSTER EJECUTIVO') || title.includes('MASTER EJECUTIVO') || title.includes('EXECUTIVE MASTER')) return 'prog-master';")
    if txt != old:
        p.write_text(txt, encoding='utf-8')

# Ensure exact detection functions in calendar after replacements.
cal = ROOT / 'calendario-academico/index.html'
if cal.exists():
    txt = cal.read_text(encoding='utf-8')
    txt = txt.replace("if (related === 'master' || title.includes('MÁSTER EJECUTIVO')) return 'master';", "if (related === 'master' || title.includes('MÁSTER EJECUTIVO') || title.includes('MASTER EJECUTIVO') || title.includes('EXECUTIVE MASTER')) return 'master';")
    txt = txt.replace("if (t.includes('MÁSTER EJECUTIVO')) return '⚫';", "if (t.includes('MÁSTER EJECUTIVO') || t.includes('MASTER EJECUTIVO') || t.includes('EXECUTIVE MASTER')) return '⚫';")
    txt = txt.replace("if (title.includes('MÁSTER EJECUTIVO')) return 'prog-master';", "if (title.includes('MÁSTER EJECUTIVO') || title.includes('MASTER EJECUTIVO') || title.includes('EXECUTIVE MASTER')) return 'prog-master';")
    cal.write_text(txt, encoding='utf-8')

# Helper functions for SEO/GEO/AEO metadata.
def ensure_meta(soup, attrs, content):
    # attrs is e.g. {'name':'description'} or {'property':'og:title'}
    tag = soup.find('meta', attrs=attrs)
    if not tag:
        tag = soup.new_tag('meta')
        for k,v in attrs.items(): tag[k]=v
        soup.head.append(tag)
    tag['content'] = content
    return tag

def ensure_link(soup, rel, href):
    tag = soup.find('link', rel=rel)
    if not tag:
        tag = soup.new_tag('link', rel=rel)
        soup.head.append(tag)
    tag['href'] = href
    return tag

def remove_schema_by_id(soup):
    for s in soup.find_all('script', id='ibero-seo-schema-v6'):
        s.decompose()

def add_schema(soup, data):
    script = soup.new_tag('script', type='application/ld+json', id='ibero-seo-schema-v6')
    script.string = json.dumps(data, ensure_ascii=False, indent=2)
    soup.head.append(script)

def course_schema(slug, data):
    offers = []
    currency_symbols = {'USD':'$','MXN':'$','PEN':'S/','COP':'$'}
    for cur, price in data['prices'].items():
        offers.append({
            '@type': 'Offer',
            'price': price,
            'priceCurrency': cur,
            'availability': 'https://schema.org/InStock',
            'url': data['url'],
            'category': 'education'
        })
    mode = 'online' if data.get('mode') == 'online' else 'onsite'
    location = {'@type':'VirtualLocation', 'url': data['url']} if mode == 'online' else {
        '@type':'Place', 'name':'Centro IBEROamericano', 'address': ORG['address']
    }
    return {
        '@context': 'https://schema.org',
        '@graph': [
            ORG,
            {
                '@type': 'Course',
                '@id': data['url'] + '#course',
                'name': data['formal'],
                'alternateName': data['commercial'],
                'description': data['description'],
                'url': data['url'],
                'provider': {'@id': SITE + '/#organization'},
                'inLanguage': 'es',
                'audience': {'@type': 'Audience', 'audienceType': data['audience']},
                'teaches': data['teaches'],
                'timeRequired': f"PT{data['hours']}H",
                'educationalCredentialAwarded': data['formal'],
                'about': [
                    {'@type': 'Thing', 'name': 'Inteligencia Artificial Aplicada'},
                    {'@type': 'Thing', 'name': 'Producto Digital'},
                    {'@type': 'Thing', 'name': 'Negocios Digitales'}
                ],
                'offers': offers,
                'hasCourseInstance': {
                    '@type': 'CourseInstance',
                    'courseMode': mode,
                    'startDate': data['start'],
                    'endDate': data['end'],
                    'location': location,
                    'instructor': {'@type':'Organization','name':'Centro IBEROamericano'}
                }
            },
            {
                '@type': 'BreadcrumbList',
                '@id': data['url'] + '#breadcrumb',
                'itemListElement': [
                    {'@type':'ListItem','position':1,'name':'Inicio','item':SITE+'/'},
                    {'@type':'ListItem','position':2,'name':'Oferta Académica','item':SITE+'/oferta-academica/'},
                    {'@type':'ListItem','position':3,'name':data['commercial'],'item':data['url']}
                ]
            }
        ]
    }

def item_list_schema(url, name, desc, slugs):
    items=[]
    for i, slug in enumerate(slugs,1):
        d=PROGRAMS[slug]
        items.append({'@type':'ListItem','position':i,'name':d['commercial'],'url':d['url'], 'description':d['description']})
    return {
        '@context':'https://schema.org',
        '@graph':[ORG, {
            '@type':'CollectionPage', '@id':url+'#webpage', 'name':name, 'description':desc, 'url':url,
            'mainEntity': {'@type':'ItemList','itemListElement':items}
        }, {
            '@type':'BreadcrumbList','@id':url+'#breadcrumb','itemListElement':[
                {'@type':'ListItem','position':1,'name':'Inicio','item':SITE+'/'},
                {'@type':'ListItem','position':2,'name':name,'item':url}
            ]
        }]
    }

# Update metadata and JSON-LD on core pages.
page_meta = {
    'index': {
        'title':'Centro IBEROamericano | IA Aplicada, Apps, Producto Digital y Negocios',
        'description':'Centro IBEROamericano: formación práctica en inteligencia artificial aplicada, marketing digital, docencia con IA, producto digital, apps, oratoria, diplomados y Máster Ejecutivo.',
        'url':SITE+'/',
        'schema': item_list_schema(SITE+'/', 'Centro IBEROamericano', 'Programas de IA aplicada, apps, producto digital, marketing, docencia, oratoria y negocios digitales.', ['marketing-digital-con-ia','ia-para-docentes','monetiza-tu-idea','crea-tu-academia','comunicacion-efectiva','diplomado-ia-negocios-marketing','master-ejecutivo-ia'])
    },
    'oferta-academica': {
        'title':'Oferta Académica IBERO | Certificados, Diplomado y Máster Ejecutivo con IA',
        'description':'Catálogo de programas IBERO: certificados intensivos, diplomado en desarrollo de aplicaciones y productos digitales, y Máster Ejecutivo en IA aplicada y dirección de productos digitales.',
        'url':SITE+'/oferta-academica/',
        'schema': item_list_schema(SITE+'/oferta-academica/', 'Oferta Académica IBERO', 'Certificados, diplomado y Máster Ejecutivo en IA aplicada, apps, producto digital, marketing, docencia y comunicación.', ['marketing-digital-con-ia','ia-para-docentes','monetiza-tu-idea','crea-tu-academia','comunicacion-efectiva','diplomado-ia-negocios-marketing','master-ejecutivo-ia'])
    },
    'certificaciones-intensivas': {
        'title':'Certificados Intensivos IBERO | IA, Marketing, Docencia, Producto Digital y Oratoria',
        'description':'Certificados intensivos de IBERO: Marketing Digital con IA, IA aplicada a la docencia, gestión de producto digital, cursos online con IA y comunicación efectiva.',
        'url':SITE+'/certificaciones-intensivas/',
        'schema': item_list_schema(SITE+'/certificaciones-intensivas/', 'Certificados Intensivos IBERO', 'Programas cortos de 12 horas para adquirir habilidades aplicadas con IA, marketing, docencia, producto digital, cursos online y oratoria.', ['marketing-digital-con-ia','ia-para-docentes','monetiza-tu-idea','crea-tu-academia','comunicacion-efectiva'])
    },
    'diplomados-intensivos': {
        'title':'Diplomados IBERO | Desarrollo de Aplicaciones y Productos Digitales con IA',
        'description':'Diplomado IBERO de 5 semanas para desarrollar aplicaciones, apps web, PWAs y productos digitales con inteligencia artificial, UX, estrategia, CRM, automatización y lanzamiento.',
        'url':SITE+'/diplomados-intensivos/',
        'schema': item_list_schema(SITE+'/diplomados-intensivos/', 'Diplomados IBERO', 'Diplomados aplicados para desarrollar, organizar y lanzar aplicaciones y productos digitales con IA.', ['diplomado-ia-negocios-marketing'])
    },
    'calendario-academico': {
        'title':'Calendario Académico IBERO 2026 | Fechas, Horarios y Precios por País',
        'description':'Calendario académico IBERO 2026 con fechas de sesiones gratis, certificados, diplomado y Máster Ejecutivo; horarios EC/CO/PE y MX; precios en USD, MXN, PEN y COP.',
        'url':SITE+'/calendario-academico/',
        'schema': item_list_schema(SITE+'/calendario-academico/', 'Calendario Académico IBERO 2026', 'Fechas de inicio, horarios y precios por país de los programas IBERO.', ['marketing-digital-con-ia','ia-para-docentes','monetiza-tu-idea','crea-tu-academia','diplomado-ia-negocios-marketing','master-ejecutivo-ia'])
    },
    'registro-y-admisiones': {
        'title':'Registro y Admisiones IBERO | Inscripción a Certificados, Diplomado y Máster Ejecutivo',
        'description':'Inscripciones IBERO para certificados intensivos, diplomado y Máster Ejecutivo en IA aplicada, producto digital, apps, marketing, docencia y comunicación.',
        'url':SITE+'/registro-y-admisiones/',
        'schema': item_list_schema(SITE+'/registro-y-admisiones/', 'Registro y Admisiones IBERO', 'Información de inscripción y admisión para programas IBERO.', ['marketing-digital-con-ia','ia-para-docentes','monetiza-tu-idea','crea-tu-academia','comunicacion-efectiva','diplomado-ia-negocios-marketing','master-ejecutivo-ia'])
    }
}

for slug, d in PROGRAMS.items():
    page_meta[slug] = {
        'title': d['title'],
        'description': d['description'],
        'url': d['url'],
        'schema': course_schema(slug, d)
    }

CORE_SLUGS = set(page_meta.keys())

for p in ROOT.rglob('index.html'):
    rel = p.relative_to(ROOT)
    slug = '' if rel.parts[0] == 'index.html' else rel.parts[0]
    key = 'index' if slug == '' else slug
    if key not in CORE_SLUGS:
        # Still add basic robots + geo to every page.
        soup = BeautifulSoup(p.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
        if soup.head:
            ensure_meta(soup, {'name':'robots'}, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
            ensure_meta(soup, {'name':'geo.region'}, 'EC-P')
            ensure_meta(soup, {'name':'geo.placename'}, 'Quito, Ecuador')
            ensure_meta(soup, {'name':'geo.position'}, '-0.180653;-78.467834')
            ensure_meta(soup, {'name':'ICBM'}, '-0.180653, -78.467834')
            p.write_text(str(soup), encoding='utf-8')
        continue
    meta = page_meta[key]
    soup = BeautifulSoup(p.read_text(encoding='utf-8', errors='ignore'), 'html.parser')
    if not soup.head:
        continue
    if soup.title:
        soup.title.string = meta['title']
    else:
        t=soup.new_tag('title'); t.string=meta['title']; soup.head.append(t)
    ensure_meta(soup, {'name':'description'}, meta['description'])
    ensure_meta(soup, {'property':'og:title'}, meta['title'].replace(' | IBERO',' | Centro IBEROamericano'))
    ensure_meta(soup, {'property':'og:description'}, meta['description'])
    ensure_meta(soup, {'property':'og:url'}, meta['url'])
    ensure_meta(soup, {'name':'twitter:title'}, meta['title'].replace(' | IBERO',' | Centro IBEROamericano'))
    ensure_meta(soup, {'name':'twitter:description'}, meta['description'])
    ensure_link(soup, 'canonical', meta['url'])
    ensure_meta(soup, {'name':'robots'}, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    ensure_meta(soup, {'name':'googlebot'}, 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1')
    ensure_meta(soup, {'name':'geo.region'}, 'EC-P')
    ensure_meta(soup, {'name':'geo.placename'}, 'Quito, Ecuador')
    ensure_meta(soup, {'name':'geo.position'}, '-0.180653;-78.467834')
    ensure_meta(soup, {'name':'ICBM'}, '-0.180653, -78.467834')
    ensure_meta(soup, {'name':'language'}, 'Spanish')
    # Generative/answer engine cues as regular metadata, not hidden promises.
    if key in PROGRAMS:
        d = PROGRAMS[key]
        ensure_meta(soup, {'name':'ibero:program'}, d['formal'])
        ensure_meta(soup, {'name':'ibero:commercial-name'}, d['commercial'])
        ensure_meta(soup, {'name':'ibero:credential'}, d['formal'])
        ensure_meta(soup, {'name':'ibero:differentiator'}, d['differentiator'])
        ensure_meta(soup, {'name':'keywords'}, ', '.join([d['formal'], d['commercial'], 'Centro IBEROamericano', 'IBERO', 'inteligencia artificial aplicada', 'producto digital', 'apps con IA', 'Ecuador', 'México', 'Colombia', 'Perú']))
    else:
        ensure_meta(soup, {'name':'keywords'}, 'Centro IBEROamericano, IBERO, inteligencia artificial aplicada, producto digital, apps con IA, marketing digital con IA, diplomado, máster ejecutivo, certificados online, Ecuador, México, Colombia, Perú')
    remove_schema_by_id(soup)
    add_schema(soup, meta['schema'])
    p.write_text(str(soup), encoding='utf-8')

# Add a lightweight llms.txt for AI/GEO/AEO discovery.
llms = f"""# Centro IBEROamericano (IBERO)

Sitio oficial: {SITE}/
Idioma principal: español.
Área de servicio: Ecuador, México, Colombia, Perú y Latinoamérica.
Enfoque: formación práctica en inteligencia artificial aplicada, desarrollo de aplicaciones, productos digitales, marketing digital, docencia con IA, oratoria profesional y negocios digitales.

## Programas vigentes

- Certificado en Marketing Digital con Inteligencia Artificial: 12 horas, inicia 27 de julio de 2026, precio USD 57 / MXN 995 / PEN 200 / COP 211000. URL: {SITE}/marketing-digital-con-ia/
- Certificado en Inteligencia Artificial Aplicada a la Docencia: 12 horas, inicia 3 de agosto de 2026, precio USD 57 / MXN 995 / PEN 200 / COP 211000. URL: {SITE}/ia-para-docentes/
- Certificado en Gestión de Producto Digital y Estrategia con Inteligencia Artificial: comercialmente Vende tu App y Consigue Clientes; 12 horas, inicia 10 de agosto de 2026, precio USD 57 / MXN 995 / PEN 200 / COP 211000. URL: {SITE}/monetiza-tu-idea/
- Certificado en Diseño y Producción de Cursos Online con Inteligencia Artificial: comercialmente Crea tu Curso Online y Monetiza; 12 horas, inicia 17 de agosto de 2026, precio USD 57 / MXN 995 / PEN 200 / COP 211000. URL: {SITE}/crea-tu-academia/
- Certificado en Comunicación Efectiva y Oratoria Profesional: taller presencial de hablar en público, precio USD 57. URL: {SITE}/comunicacion-efectiva/
- Diplomado en Desarrollo de Aplicaciones y Gestión de Productos Digitales con Inteligencia Artificial: 5 semanas, 60 horas, inicia 5 de octubre de 2026, precio USD 277 / MXN 4850 / PEN 975 / COP 1025000. URL: {SITE}/diplomado-ia-negocios-marketing/
- Máster Ejecutivo en Inteligencia Artificial Aplicada y Dirección de Productos Digitales: 6 meses, 234 horas, inicia 19 de octubre de 2026, precio USD 926.25 / MXN 16191 / PEN 3251 / COP 3423420. URL: {SITE}/master-ejecutivo-ia/

## Diferenciadores

IBERO forma personas capaces de crear, comunicar, vender y escalar soluciones digitales con inteligencia artificial. Los certificados entregan habilidades puntuales aplicables en pocos días. El diplomado acompaña el desarrollo y lanzamiento de un producto digital durante 5 semanas. El Máster Ejecutivo forma dirección estratégica y escalamiento de productos digitales con IA durante 6 meses.
"""
(ROOT/'llms.txt').write_text(llms, encoding='utf-8')

# Normalize robots and sitemap.
robots = """User-agent: *
Allow: /

Sitemap: https://ibero.education/sitemap.xml
Sitemap: https://ibero.education/llms.txt
"""
(ROOT/'robots.txt').write_text(robots, encoding='utf-8')

urls = [
    ('/', '1.0'),('/oferta-academica/','0.9'),('/calendario-academico/','0.9'),('/certificaciones-intensivas/','0.9'),('/marketing-digital-con-ia/','0.9'),('/ia-para-docentes/','0.9'),('/monetiza-tu-idea/','0.9'),('/crea-tu-academia/','0.9'),('/comunicacion-efectiva/','0.85'),('/diplomados-intensivos/','0.9'),('/diplomado-ia-negocios-marketing/','0.95'),('/master-ejecutivo-ia/','0.95'),('/executive-master/','0.85'),('/clase-gratis/','0.85'),('/registro-y-admisiones/','0.85'),('/diplomas/','0.7'),('/contacto/','0.7'),('/ayuda-financiera/','0.7'),('/metodologia/','0.7'),('/ibero-labs/','0.7'),('/ibero-academy/','0.7'),('/goatify/','0.7'),('/publicaciones/','0.6'),('/artes-liberales/','0.6'),('/consultoria-en-educacion/','0.6'),('/english-courses/','0.6'),('/trabaja-con-nosotros/','0.5')
]
sm = ['<?xml version="1.0" encoding="UTF-8"?>','<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for path, priority in urls:
    sm += ['  <url>', f'    <loc>{SITE}{path}</loc>', f'    <lastmod>{TODAY}</lastmod>', '    <changefreq>weekly</changefreq>', f'    <priority>{priority}</priority>', '  </url>']
sm.append('</urlset>')
(ROOT/'sitemap.xml').write_text('\n'.join(sm)+'\n', encoding='utf-8')

# Audit report.
report = []
for slug,d in PROGRAMS.items():
    if slug == 'executive-master': continue
    report.append({
        'programa_comercial': d['commercial'],
        'nombre_formal_documento': d['formal'],
        'tipo': d['typeLabel'],
        'inicio': d['start'], 'fin': d['end'], 'horas': d['hours'], 'precios': d['prices'],
        'diferenciador': d['differentiator']
    })
(ROOT/'AUDITORIA_V6_PROGRAMAS_SEO_GEO_AEO_2026-07-02.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
(ROOT/'AUDITORIA_V6_RESUMEN_2026-07-02.txt').write_text(
    'V6 aplicado sobre V5. Se corrigieron nombres formales de certificados/diplomado/máster, navegación, chatbot, calendario, meta SEO, schema JSON-LD Course/ItemList/EducationalOrganization, geo tags, sitemap, robots y llms.txt. No se movieron fechas, horarios ni precios aprobados.\n', encoding='utf-8')

print('V6 patch applied')
