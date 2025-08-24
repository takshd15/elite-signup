from __future__ import annotations

import json
import re
from typing import Any, Dict

SCRIPT_TAG_RE = re.compile(r"(?is)<script.*?>.*?</script.*?>")


def sanitize_text(value: str | None) -> str | None:
    if value is None:
        return None
    # strip script tags
    clean = SCRIPT_TAG_RE.sub("", value)
    # remove control chars
    clean = re.sub(r"\p{C}", "", clean)
    # remove CR/LF/TAB
    clean = re.sub(r"[\r\n\t]", "", clean)
    # escape HTML
    clean = (clean
             .replace("&", "&amp;")
             .replace("<", "&lt;")
             .replace(">", "&gt;")
             .replace('"', "&quot;")
             .replace("'", "&#x27;"))
    return clean.strip()


def sanitize_json_obj(obj: Any) -> Any:
    if isinstance(obj, dict):
        return {k: sanitize_json_obj(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [sanitize_json_obj(x) for x in obj]
    if isinstance(obj, str):
        return sanitize_text(obj) or ""
    return obj
