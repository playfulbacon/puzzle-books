"""Bundle review/ into one self-contained HTML file (CSS, JS, and puzzle data inlined).

Useful for emailing the app to a co-reviewer or publishing it where only a single file
is accepted. --fragment omits <!doctype>/<html>/<head>/<body> for hosts that wrap the page.

    python tools/bundle_review_app.py --out build/review-standalone.html
"""
import argparse
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REVIEW = os.path.join(ROOT, "review")


def read(rel: str) -> str:
    with open(os.path.join(REVIEW, rel), encoding="utf-8") as f:
        return f.read()


def bundle(fragment: bool) -> str:
    html = read("index.html")
    html = re.sub(r'<link rel="stylesheet" href="([^"]+)">',
                  lambda m: "<style>\n" + read(m.group(1)).replace("</style", "<\\/style") + "\n</style>", html)
    html = re.sub(r'<script src="([^"]+)"></script>',
                  lambda m: "<script>\n" + read(m.group(1)).replace("</script", "<\\/script") + "\n</script>", html)
    if fragment:
        head = re.search(r"<head>(.*?)</head>", html, re.S).group(1)
        body = re.search(r"<body>(.*?)</body>", html, re.S).group(1)
        head = re.sub(r'<meta [^>]+>\s*', "", head)
        html = head.strip() + "\n" + body.strip() + "\n"
    return html


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    ap.add_argument("--fragment", action="store_true")
    a = ap.parse_args()
    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    with open(a.out, "w", encoding="utf-8") as f:
        f.write(bundle(a.fragment))
    print(f"wrote {a.out} ({os.path.getsize(a.out)//1024} KB)")
