"""
Build public/zip/<first 3 digits>.json from the Census ZCTA gazetteer.

    python scripts/build_zip_index.py

Each file maps ZIP -> [lat, lon] (ZCTA centroid, 3 decimals ≈ 100 m).
The browser loads only the one small file for the visitor's ZIP prefix,
so the ZIP itself is never sent anywhere.
"""

import csv
import io
import json
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

URL = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_zcta_national.zip"
OUT = Path(__file__).resolve().parents[1] / "public" / "zip"

raw = urllib.request.urlopen(URL, timeout=60).read()
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    text = z.read(z.namelist()[0]).decode("utf-8-sig")

delimiter = "|" if "|" in text.splitlines()[0] else "\t"
rows = csv.reader(io.StringIO(text), delimiter=delimiter)
header = [h.strip() for h in next(rows)]
i_zip, i_lat, i_lon = header.index("GEOID"), header.index("INTPTLAT"), header.index("INTPTLONG")

groups = defaultdict(dict)
for r in rows:
    z = r[i_zip].strip()
    groups[z[:3]][z] = [round(float(r[i_lat]), 3), round(float(r[i_lon].strip()), 3)]

OUT.mkdir(parents=True, exist_ok=True)
for prefix, zips in groups.items():
    (OUT / f"{prefix}.json").write_text(json.dumps(zips, separators=(",", ":")))
print(f"{sum(len(z) for z in groups.values())} ZIPs in {len(groups)} files")
