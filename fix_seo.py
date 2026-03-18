import os
import glob
from bs4 import BeautifulSoup

DOMAIN = "https://ibero.education"
DEFAULT_OG_IMAGE = f"{DOMAIN}/fotos/og-image.jpg"

def get_page_info(filepath):
    """Return dictionary with canonical url, title fallback, etc."""
    dirname = os.path.dirname(filepath).replace("\\", "/")
    if dirname == "":
        canonical = f"{DOMAIN}/"
        folder_name = "Centro Iberoamericano (IBERO)"
    else:
        canonical = f"{DOMAIN}/{dirname}/"
        folder_name = dirname.replace("-", " ").title()
    return {
        "canonical": canonical,
        "default_title": f"{folder_name} | IBERO Educación",
        "default_description": f"Descubre los programas de {folder_name} en el Centro Iberoamericano. Educación práctica y estratégica con líderes en Inteligencia Artificial y Negocios."
    }

def fix_seo(filepath):
    info = get_page_info(filepath)
    canonical_url = info["canonical"]

    with open(filepath, "r", encoding="utf-8") as f:
        html = f.read()

    soup = BeautifulSoup(html, "html.parser")
    head = soup.head
    if not head:
        head = soup.new_tag("head")
        soup.html.insert(0, head)

    # 1. Title
    title_tag = head.find("title")
    if not title_tag:
        title_tag = soup.new_tag("title")
        title_tag.string = info["default_title"]
        head.append(title_tag)
    elif not title_tag.string or not title_tag.string.strip():
        title_tag.string = info["default_title"]
        
    title_text = title_tag.string.strip()

    # 2. Meta description
    desc_tag = head.find("meta", attrs={"name": "description"})
    if not desc_tag:
        desc_tag = soup.new_tag("meta", attrs={"name": "description", "content": info["default_description"]})
        head.append(desc_tag)
    elif not desc_tag.get("content") or not desc_tag.get("content").strip():
        desc_tag["content"] = info["default_description"]
        
    desc_text = desc_tag.get("content").strip()

    # 3. Canonical Link
    canonical_tag = head.find("link", rel="canonical")
    if canonical_tag:
        canonical_tag["href"] = canonical_url
    else:
        canonical_tag = soup.new_tag("link", rel="canonical", href=canonical_url)
        head.append(canonical_tag)

    # 4. Open Graph Tags
    og_tags_needed = {
        "og:title": title_text,
        "og:description": desc_text,
        "og:url": canonical_url,
        "og:type": "website",
        "og:image": DEFAULT_OG_IMAGE
    }

    for prop, content in og_tags_needed.items():
        og_tag = head.find("meta", property=prop)
        if og_tag:
            og_tag["content"] = content
        else:
            og_tag = soup.new_tag("meta", property=prop, content=content)
            head.append(og_tag)

    # Specific broken link fixes for oferta-academica/index.html
    if "oferta-academica" in filepath.replace("\\", "/"):
        for a in soup.find_all("a", href=True):
            href = a["href"]
            if href == "oferta-academica.html":
                a["href"] = "/oferta-academica/"
            elif href == "certificaciones.html":
                a["href"] = "/certificaciones-intensivas/"
            elif href == "diplomados-ejecutivos.html":
                a["href"] = "/diplomados-intensivos/"
            elif href == "executive-masters.html":
                a["href"] = "/executive-master/"
            elif href == "ingles-continuo.html":
                a["href"] = "/english-courses/"
            elif href == "index.html":
                a["href"] = "/"

    # Also, ensure all menu links starting with / have trailing slash (except if they have extensions)
    for a in soup.find_all("a", href=True):
        href = a["href"]
        if href.startswith("/") and not href.endswith("/") and "." not in href and "?" not in href and "#" not in href:
            a["href"] = href + "/"

    with open(filepath, "w", encoding="utf-8") as f:
        f.write(str(soup))
        
    return canonical_url

def generate_sitemap(urls):
    sitemap_content = '<?xml version="1.0" encoding="UTF-8"?>\\n'
    sitemap_content += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\\n'
    
    for url in urls:
        priority = "1.0" if url == f"{DOMAIN}/" else "0.8"
        sitemap_content += f'''  <url>
    <loc>{url}</loc>
    <changefreq>weekly</changefreq>
    <priority>{priority}</priority>
  </url>\\n'''
        
    sitemap_content += '</urlset>'
    
    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(sitemap_content)
        
def generate_robots():
    robots_content = f"User-agent: *\\nAllow: /\\n\\nSitemap: {DOMAIN}/sitemap.xml\\n"
    with open("robots.txt", "w", encoding="utf-8") as f:
        f.write(robots_content)

def main():
    html_files = glob.glob("**/*.html", recursive=True)
    all_urls = []
    
    for filepath in html_files:
        url = fix_seo(filepath)
        all_urls.append(url)
        print(f"Fixed SEO and Links for {filepath}")
        
    # Remove duplicates and sort for sitemap
    unique_urls = sorted(list(set(all_urls)))
    generate_sitemap(unique_urls)
    print("Generated sitemap.xml")
    
    generate_robots()
    print("Generated robots.txt")
    
if __name__ == "__main__":
    main()
