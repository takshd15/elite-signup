# security/sanitizer.py (Python 3.9 compatible)
from __future__ import annotations

import html
import re
import unicodedata
from typing import Any, Optional, Dict, List

# Strip <script>...</script> blocks (case-insensitive, dot matches newlines)
SCRIPT_TAG_RE = re.compile(r"(?is)<\s*script[^>]*>.*?<\s*/\s*script\s*>")
# Remove inline on* handlers like onclick="..."
ON_EVENT_ATTR_RE = re.compile(r'(?i)\son\w+\s*=\s*(?:"[^"]*"|\'[^\']*\'|[^\s>]+)')
# Neutralize javascript: URIs
JS_PROTOCOL_RE = re.compile(r"(?i)\bjavascript\s*:")

def _strip_unicode_controls(s: str) -> str:
    """Remove Unicode control/format/surrogate/private-use/unassigned chars.
    Preserve common whitespace (\t, \n, \r) and normal printable chars."""
    out = []
    for ch in s:
        cat = unicodedata.category(ch)
        if ch in ("\t", "\n", "\r"):
            out.append(ch)
        elif cat in ("Cc", "Cf", "Cs", "Co", "Cn"):
            continue
        else:
            out.append(ch)
    return "".join(out)

def sanitize_text(value: Optional[str]) -> Optional[str]:
    if value is None:
        return None

    clean = value

    # Remove control-ish Unicode safely (no \p{C})
    clean = _strip_unicode_controls(clean)

    # Strip script blocks & obvious inline handlers / js: URIs
    clean = SCRIPT_TAG_RE.sub("", clean)
    clean = ON_EVENT_ATTR_RE.sub("", clean)
    clean = JS_PROTOCOL_RE.sub("", clean)

    # Remove CR/LF/TAB (keeps your original behavior)
    clean = re.sub(r"[\r\n\t]", "", clean)

    # HTML-escape (& < > " ')
    clean = html.escape(clean, quote=True).replace("'", "&#x27;")

    return clean.strip()

def sanitize_json_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: sanitize_json_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_json_obj(x) for x in obj]
    if isinstance(obj, str):
        return sanitize_text(obj) or ""
    return obj
