"""
Build the ZIP lookup files from Census data.

    python scripts/build_zip_index.py

public/zip/<first 3 digits>.json   ZIP -> [lat, lon, county FIPS]  (served to browsers)
server/api/data/counties.json      county FIPS -> [name, state]     (used by the API)

The browser loads only the one small file for the visitor's ZIP prefix, so the
ZIP itself never leaves the device. A ZIP that spans counties is assigned the
county holding most of its land.
"""

import csv
import io
import json
import urllib.request
import zipfile
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
GAZETTEER = "https://www2.census.gov/geo/docs/maps-data/data/gazetteer/2026_Gazetteer/2026_Gaz_zcta_national.zip"
RELATIONSHIP = "https://www2.census.gov/geo/docs/maps-data/data/rel2020/zcta520/tab20_zcta520_county20_natl.txt"
STATE_FIPS = {
    "01": "AL", "02": "AK", "04": "AZ", "05": "AR", "06": "CA", "08": "CO", "09": "CT", "10": "DE", "11": "DC",
    "12": "FL", "13": "GA", "15": "HI", "16": "ID", "17": "IL", "18": "IN", "19": "IA", "20": "KS", "21": "KY",
    "22": "LA", "23": "ME", "24": "MD", "25": "MA", "26": "MI", "27": "MN", "28": "MS", "29": "MO", "30": "MT",
    "31": "NE", "32": "NV", "33": "NH", "34": "NJ", "35": "NM", "36": "NY", "37": "NC", "38": "ND", "39": "OH",
    "40": "OK", "41": "OR", "42": "PA", "44": "RI", "45": "SC", "46": "SD", "47": "TN", "48": "TX", "49": "UT",
    "50": "VT", "51": "VA", "53": "WA", "54": "WV", "55": "WI", "56": "WY", "72": "PR",
}


def rows(text: str):
    text = text.lstrip("﻿")
    delimiter = "|" if "|" in text.splitlines()[0] else "\t"
    reader = csv.reader(io.StringIO(text), delimiter=delimiter)
    header = [h.strip() for h in next(reader)]
    for r in reader:
        yield dict(zip(header, (c.strip() for c in r)))


raw = urllib.request.urlopen(GAZETTEER, timeout=60).read()
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    gaz = z.read(z.namelist()[0]).decode("utf-8-sig")
points = {r["GEOID"]: (round(float(r["INTPTLAT"]), 3), round(float(r["INTPTLONG"]), 3)) for r in rows(gaz)}

rel = urllib.request.urlopen(RELATIONSHIP, timeout=120).read().decode("utf-8-sig")
best = {}
counties = {}
for r in rows(rel):
    county = r["GEOID_COUNTY_20"]
    if county and county[:2] in STATE_FIPS:
        counties[county] = [r["NAMELSAD_COUNTY_20"], STATE_FIPS[county[:2]]]
    z = r["GEOID_ZCTA5_20"]
    if not z or not county:
        continue
    land = int(r["AREALAND_PART"] or 0)
    if z not in best or land > best[z][1]:
        best[z] = (county, land)

groups = defaultdict(dict)
for z, (lat, lon) in points.items():
    groups[z[:3]][z] = [lat, lon, best[z][0] if z in best else None]

out = ROOT / "public" / "zip"
out.mkdir(parents=True, exist_ok=True)
for prefix, zips in groups.items():
    (out / f"{prefix}.json").write_text(json.dumps(zips, separators=(",", ":")))
data_dir = ROOT / "server" / "api" / "data"
data_dir.mkdir(parents=True, exist_ok=True)
(data_dir / "counties.json").write_text(json.dumps(dict(sorted(counties.items())), separators=(",", ":")))
print(f"{len(points)} ZIPs in {len(groups)} files; {sum(1 for z in points if z in best)} with a county; {len(counties)} counties")
