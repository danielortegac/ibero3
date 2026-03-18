import os
import glob
from html.parser import HTMLParser
import json

class SEOParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ""
        self.in_title = False
        self.meta_desc = ""
        self.canonical = ""
        self.links = []
        self.og_title = ""
        self.og_description = ""
        self.og_url = ""
        self.og_image = ""

    def handle_starttag(self, tag, attrs):
        attrs_dict = dict(attrs)
        if tag == "title":
            self.in_title = True
        elif tag == "meta":
            name = attrs_dict.get("name", "").lower()
            property_attr = attrs_dict.get("property", "").lower()
            content = attrs_dict.get("content", "")
            
            if name == "description":
                self.meta_desc = content
            elif property_attr == "og:title":
                self.og_title = content
            elif property_attr == "og:description":
                self.og_description = content
            elif property_attr == "og:url":
                self.og_url = content
            elif property_attr == "og:image":
                self.og_image = content
                
        elif tag == "link":
            if attrs_dict.get("rel") == "canonical":
                self.canonical = attrs_dict.get("href", "")
        elif tag == "a":
            href = attrs_dict.get("href")
            if href:
                self.links.append(href)

    def handle_data(self, data):
        if self.in_title:
            self.title += data

    def handle_endtag(self, tag):
        if tag == "title":
            self.in_title = False

def audit_files():
    # Find all html files
    html_files = glob.glob("**/*.html", recursive=True)
    report = {}
    
    for filepath in html_files:
        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
            content = f.read()
            
        parser = SEOParser()
        parser.feed(content)
        
        # Determine expected canonical. If index.html at root, it's https://ibero.education/
        # If inside a dir, e.g., artes-liberales/index.html, it's https://ibero.education/artes-liberales/
        dirname = os.path.dirname(filepath).replace("\\", "/")
        if dirname == "":
            expected_canonical = "https://ibero.education/"
        else:
            expected_canonical = f"https://ibero.education/{dirname}/"
            
        issues = []
        
        if not parser.title.strip():
            issues.append("Missing <title>")
        elif len(parser.title) < 10 or len(parser.title) > 70:
            issues.append(f"Title length is not optimal: {len(parser.title)} chars")
            
        if not parser.meta_desc.strip():
            issues.append("Missing <meta name='description'>")
        elif len(parser.meta_desc) < 50 or len(parser.meta_desc) > 160:
            issues.append(f"Meta description length not optimal: {len(parser.meta_desc)} chars")
            
        if not parser.canonical:
            issues.append("Missing <link rel='canonical'>")
        elif parser.canonical != expected_canonical:
            issues.append(f"Canonical URL mismatch. Expected: {expected_canonical}, Found: {parser.canonical}")
            
        if not parser.og_title:
            issues.append("Missing og:title")
        if not parser.og_description:
            issues.append("Missing og:description")
        if not parser.og_url:
            issues.append("Missing og:url")
        if not parser.og_image:
            issues.append("Missing og:image")
            
        bad_links = []
        for link in parser.links:
            if link.startswith("http://"):
                bad_links.append(f"Insecure link (http): {link}")
            elif "centro-iberoamericano" in link.lower() and "github" not in link.lower():
                bad_links.append(f"Possible staging/dev link used: {link}")
            elif link.endswith(".html") and not (link.startswith("http") or link.startswith("mailto:")):
                bad_links.append(f"Relative .html link used instead of directory path: {link}")
            # Ensure menu links have trailing slashes
            elif link.startswith("/") and len(link) > 1 and not link.endswith("/") and "#" not in link and "?" not in link and "." not in link:
                bad_links.append(f"Missing trailing slash in internal link: {link}")

        report[filepath] = {
            "title": parser.title.strip(),
            "meta_description": parser.meta_desc,
            "canonical": parser.canonical,
            "issues": issues,
            "bad_links_count": len(bad_links),
            "bad_links": bad_links[:15] # limit to top 15
        }
        
    with open("audit_report.json", "w", encoding="utf-8") as f:
        json.dump(report, f, indent=2)

if __name__ == "__main__":
    audit_files()
    print("Audit generated successfully.")
