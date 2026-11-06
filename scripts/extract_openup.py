"""
Extract election results from the OpenUpSA elections-api SQLite database
(https://github.com/OpenUpSA/elections-api, data/elections.sqlite.gz) into a
compact JSON file the site imports at build time.

The hosted API (iec-v2.code4sa.org) is offline, but the repository still ships
the full database with IEC results for the 2009 and 2014 general elections at
country, province, municipality, ward and voting-district level.

Usage:
    python scripts/extract_openup.py <elections.sqlite> <municipality.csv> <out.json>
"""

import csv
import json
import re
import sqlite3
import sys

# Full IEC ballot names -> short party ids used throughout the site.
PARTY_IDS = {
    "AFRICAN NATIONAL CONGRESS": "ANC",
    "DEMOCRATIC ALLIANCE": "DA",
    "ECONOMIC FREEDOM FIGHTERS": "EFF",
    "INKATHA FREEDOM PARTY": "IFP",
    "CONGRESS OF THE PEOPLE": "COPE",
    "VRYHEIDSFRONT PLUS": "FFP",
    "UNITED DEMOCRATIC MOVEMENT": "UDM",
    "AFRICAN CHRISTIAN DEMOCRATIC PARTY": "ACDP",
    "INDEPENDENT DEMOCRATS": "ID",
    "NATIONAL FREEDOM PARTY": "NFP",
    "PAN AFRICANIST CONGRESS OF AZANIA": "PAC",
    "AFRICAN INDEPENDENT CONGRESS": "AIC",
    "AGANG SOUTH AFRICA": "AGANG",
    "UNITED CHRISTIAN DEMOCRATIC PARTY": "UCDP",
    "MINORITY FRONT": "MF",
    "AZANIAN PEOPLE'S ORGANISATION": "AZAPO",
    "AFRICAN PEOPLE'S CONVENTION": "APC",
    "AL JAMA-AH": "ALJ",
    "PATRIOTIC ALLIANCE": "PA",
}

MUNI_TOP_N = 6


def party_id(name: str) -> str:
    clean = re.sub(r"\s+", " ", name).strip().upper()
    if clean in PARTY_IDS:
        return PARTY_IDS[clean]
    return "X:" + clean.title()


def parse(raw):
    if not raw:
        return None
    data = json.loads(raw)
    votes = {}
    for name, n in data.get("vote_count", {}).items():
        pid = party_id(name)
        votes[pid] = votes.get(pid, 0) + int(n)
    meta = data.get("meta", {})
    valid = sum(votes.values())
    registered = int(meta.get("num_registered") or 0)
    total = int(meta.get("total_votes") or 0)
    return {
        "registered": registered,
        "cast": total,
        "valid": valid,
        "spoilt": int(meta.get("spoilt_votes") or 0),
        "turnout": round(total / registered * 100, 2) if registered else None,
        "votes": dict(sorted(votes.items(), key=lambda kv: -kv[1])),
    }


def trim(result):
    """Keep the top N parties per municipality and fold the rest into OTHER."""
    if result is None:
        return None
    items = list(result["votes"].items())
    top = dict(items[:MUNI_TOP_N])
    rest = sum(n for _, n in items[MUNI_TOP_N:])
    if rest:
        top["OTHER"] = rest
    return {**result, "votes": top}


def main(db_path, muni_csv, out_path):
    names = {}
    with open(muni_csv, newline="", encoding="utf-8-sig") as fh:
        for row in csv.DictReader(fh):
            names[row["CAT_B"].strip()] = row["MUNICNAME"].strip()

    con = sqlite3.connect(db_path)
    out = {}

    for year, nat, prov in con.execute(
        "select year, results_national, results_provincial from country"
    ):
        out[str(year)] = {
            "national": {"country": parse(nat), "provinces": {}, "municipalities": []},
            "provincial": {"provinces": {}},
        }

    prov_pk = {}
    for pk, pid, year, nat, prov in con.execute(
        "select pk, province_id, year, results_national, results_provincial from provinces"
    ):
        prov_pk[pk] = pid
        y = out[str(year)]
        y["national"]["provinces"][pid] = parse(nat)
        y["provincial"]["provinces"][pid] = parse(prov)

    for code, year, nat, ppk in con.execute(
        "select municipality_id, year, results_national, province_pk from municipalities"
    ):
        result = trim(parse(nat))
        if result is None:
            continue
        out[str(year)]["national"]["municipalities"].append(
            {
                "code": code,
                "name": names.get(code, code),
                "province": prov_pk.get(ppk),
                **result,
            }
        )

    for y in out.values():
        y["national"]["municipalities"].sort(key=lambda m: (m["province"] or "", m["name"]))

    with open(out_path, "w", encoding="utf-8") as fh:
        json.dump(out, fh, separators=(",", ":"), ensure_ascii=False)
    print(f"wrote {out_path}")
    for year, y in out.items():
        print(year, "provinces", len(y["national"]["provinces"]), "munis", len(y["national"]["municipalities"]))


if __name__ == "__main__":
    main(*sys.argv[1:4])
