import glob
import re
from bs4 import BeautifulSoup

DOMAIN = "https://ibero.education"

# Mapping of any wrong variations (like missing accents or old names) to the EXACT requested ones.
LINK_MAPPINGS = {
    "/consultoria-en-educacion": "/consultoría-en-educación",
    "/consultoria-en-educacion/": "/consultoría-en-educación/",
    "https://ibero.education/consultoria-en-educacion": "https://ibero.education/consultoría-en-educación/",
    "https://ibero.education/consultoria-en-educacion/": "https://ibero.education/consultoría-en-educación/",
    
    "/ingles-continuo": "/english-courses",
    "/ingles-continuo/": "/english-courses/",
    "https://ibero.education/ingles-continuo": "https://ibero.education/english-courses/",
    "https://ibero.education/ingles-continuo/": "https://ibero.education/english-courses/",
    
    # Missing slashes in standard explicit menus
    "https://ibero.education/publicaciones": "https://ibero.education/publicaciones/"
}

def fix_all_links():
    html_files = glob.glob("**/*.html", recursive=True)
    for filepath in html_files:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            html = f.read()
            
        soup = BeautifulSoup(html, "html.parser")
        changed = False
        
        for a in soup.find_all("a", href=True):
            href = a["href"].strip()
            new_href = href
            
            # Apply direct mapping
            for wrong, correct in LINK_MAPPINGS.items():
                if new_href == wrong:
                    new_href = correct
                    
            # Ensure any valid directory link has trailing slash
            # (only if it starts with DOMAIN or starts with / and is not a file/anchor)
            if new_href.startswith(DOMAIN) or (new_href.startswith("/") and not href.startswith("//")):
                base = new_href.split("?")[0].split("#")[0]
                if not base.endswith("/") and "." not in base.split("/")[-1]:
                    new_href = new_href.replace(base, base + "/")
                    
            if new_href != href:
                a["href"] = new_href
                changed = True
                
        if changed:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(soup.prettify(formatter="html"))
            print(f"Fixed links in {filepath}")

if __name__ == "__main__":
    fix_all_links()
    print("Link verification complete.")
