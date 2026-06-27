#!/usr/bin/env python3
"""
Build flight-stats-import.json from Excel-parsed flight stats + live travel map.

Usage:
  python3 scripts/build-flight-stats-import.py [--input /tmp/flight-stats-parsed.json]

Fetches current map from API, mwgg airports.json, computes per-airport stats,
and writes scripts/flight-stats-import.json (NEW cities/countries only).
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
import urllib.request
from collections import defaultdict
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
DEFAULT_INPUT = Path("/tmp/flight-stats-parsed.json")
DEFAULT_OUTPUT = SCRIPT_DIR / "flight-stats-import.json"
MAP_URL = "https://elifnurcicekdagi.com/api/v1/travel/map"
AIRPORTS_URL = "https://raw.githubusercontent.com/mwgg/Airports/master/airports.json"

PALETTE = [
    "#C25B3F",
    "#D4A017",
    "#4A7C59",
    "#5B7C99",
    "#8B6B4A",
    "#7A5C8A",
    "#3D6B6B",
]

# mwgg sometimes uses ISO2 directly; map names for new countries + fallbacks
COUNTRY_NAMES: dict[str, str] = {
    "AD": "Andorra",
    "AE": "United Arab Emirates",
    "AF": "Afghanistan",
    "AR": "Argentina",
    "AT": "Austria",
    "AU": "Australia",
    "BD": "Bangladesh",
    "BE": "Belgium",
    "BR": "Brazil",
    "CA": "Canada",
    "CH": "Switzerland",
    "CL": "Chile",
    "CN": "China",
    "CO": "Colombia",
    "CZ": "Czech Republic",
    "DE": "Germany",
    "EC": "Ecuador",
    "EG": "Egypt",
    "ES": "Spain",
    "FR": "France",
    "GB": "United Kingdom",
    "GR": "Greece",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IL": "Israel",
    "IN": "India",
    "IQ": "Iraq",
    "IT": "Italy",
    "JO": "Jordan",
    "JP": "Japan",
    "KE": "Kenya",
    "KR": "South Korea",
    "KW": "Kuwait",
    "MO": "Macau",
    "MV": "Maldives",
    "MX": "Mexico",
    "MY": "Malaysia",
    "NG": "Nigeria",
    "NL": "Netherlands",
    "NO": "Norway",
    "NZ": "New Zealand",
    "PA": "Panama",
    "PH": "Philippines",
    "PK": "Pakistan",
    "PL": "Poland",
    "PT": "Portugal",
    "QA": "Qatar",
    "SA": "Saudi Arabia",
    "SC": "Seychelles",
    "SE": "Sweden",
    "SG": "Singapore",
    "TH": "Thailand",
    "TR": "Turkey",
    "TW": "Taiwan",
    "UG": "Uganda",
    "US": "United States",
    "VA": "Vatican City",
    "ZA": "South Africa",
}

# Common mwgg country name → ISO2 when country field is a name not code
COUNTRY_NAME_TO_ISO2: dict[str, str] = {
    "united states": "US",
    "united kingdom": "GB",
    "united arab emirates": "AE",
    "south africa": "ZA",
    "saudi arabia": "SA",
    "new zealand": "NZ",
    "south korea": "KR",
    "hong kong": "HK",
    "czech republic": "CZ",
    "egypt": "EG",
    "jordan": "JO",
    "iraq": "IQ",
    "bangladesh": "BD",
    "pakistan": "PK",
    "kuwait": "KW",
    "norway": "NO",
    "panama": "PA",
    "poland": "PL",
    "australia": "AU",
    "india": "IN",
    "japan": "JP",
    "mexico": "MX",
    "chile": "CL",
    "qatar": "QA",
    "turkey": "TR",
    "china": "CN",
    "germany": "DE",
    "france": "FR",
    "italy": "IT",
    "spain": "ES",
    "netherlands": "NL",
    "belgium": "BE",
    "sweden": "SE",
    "thailand": "TH",
    "malaysia": "MY",
    "philippines": "PH",
    "singapore": "SG",
    "kenya": "KE",
    "nigeria": "NG",
    "uganda": "UG",
    "israel": "IL",
    "greece": "GR",
    "hungary": "HU",
    "portugal": "PT",
    "austria": "AT",
    "switzerland": "CH",
    "argentina": "AR",
    "brazil": "BR",
    "colombia": "CO",
    "ecuador": "EC",
    "canada": "CA",
    "macau": "MO",
    "maldives": "MV",
    "seychelles": "SC",
    "taiwan": "TW",
    "vatican city": "VA",
}


def fetch_json(url: str) -> dict | list:
    req = urllib.request.Request(url, headers={"User-Agent": "elifnur-flight-import/1.0"})
    with urllib.request.urlopen(req, timeout=60) as res:
        return json.loads(res.read().decode())


def slugify(name: str) -> str:
    s = name.lower()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def normalize_name(name: str) -> str:
    s = name.lower().strip()
    s = unicodedata.normalize("NFD", s)
    s = "".join(c for c in s if unicodedata.category(c) != "Mn")
    s = re.sub(r"[^a-z0-9]+", " ", s).strip()
    return s


def resolve_iso2(country_field: str) -> str | None:
    raw = country_field.strip()
    if len(raw) == 2 and raw.isalpha():
        return raw.upper()
    key = normalize_name(raw)
    return COUNTRY_NAME_TO_ISO2.get(key)


def country_display_name(iso2: str, existing: dict[str, str]) -> str:
    if iso2 in existing:
        return existing[iso2]
    return COUNTRY_NAMES.get(iso2, iso2)


def next_country_color(used_colors: set[str], count: int) -> str:
    for c in PALETTE:
        if c not in used_colors:
            return c
    return PALETTE[count % len(PALETTE)]


def build_airports_index(data: dict) -> dict[str, dict]:
    index: dict[str, dict] = {}
    for key, ap in data.items():
        if not ap or not isinstance(ap, dict):
            continue
        iata = (ap.get("iata") or key or "").upper()
        if len(iata) == 3:
            index[iata] = ap
    return index


def compute_airport_stats(routes: list[dict]) -> dict[str, dict]:
    stats: dict[str, dict] = defaultdict(
        lambda: {"blockHrs": 0.0, "sectors": 0, "routes": set(), "flights": set()}
    )
    airline = "QR"
    for r in routes:
        flight = r.get("flight", "")
        m = re.match(r"^([A-Z0-9]{2})", flight)
        if m:
            airline = m.group(1)
        block = float(r.get("blockHrs") or 0)
        route_key = f"{r['from']}-{r['to']}"
        for ap in (r["from"], r["to"]):
            stats[ap]["blockHrs"] += block
            stats[ap]["sectors"] += 1
            stats[ap]["routes"].add(route_key)
            stats[ap]["flights"].add(flight)
    return dict(stats), airline


# Alternate airports — own waypoint even when metro city exists (unique id + display name)
ALT_AIRPORT_CITIES: dict[str, dict[str, str]] = {
    "STN": {
        "id": "london-stansted",
        "name": "London Stansted",
        "country": "GB",
        "countryName": "United Kingdom",
        "note": "Stansted approaches",
    },
    "IAD": {
        "id": "washington-dulles",
        "name": "Washington Dulles",
        "country": "US",
        "countryName": "United States",
        "note": "Dulles corridor",
    },
    "NLU": {
        "id": "mexico-aifa",
        "name": "Mexico City (AIFA)",
        "country": "MX",
        "countryName": "Mexico",
        "note": "Felipe Ángeles highland",
    },
    "NRT": {
        "id": "tokyo-narita",
        "name": "Tokyo Narita",
        "country": "JP",
        "countryName": "Japan",
        "note": "Narita long final",
    },
    "PKX": {
        "id": "beijing-daxing",
        "name": "Beijing Daxing",
        "country": "CN",
        "countryName": "China",
        "note": "Daxing axis",
    },
}

# Display names (mwgg city names are often airport names)
CITY_NAME_OVERRIDES: dict[str, str] = {
    "ADL": "Adelaide",
    "AMM": "Amman",
    "BGW": "Baghdad",
    "CAI": "Cairo",
    "DAC": "Dhaka",
    "DMM": "Dammam",
    "DXB": "Dubai",
    "EBL": "Erbil",
    "ISB": "Islamabad",
    "JNB": "Johannesburg",
    "KHI": "Karachi",
    "KWI": "Kuwait City",
    "LHE": "Lahore",
    "MAA": "Chennai",
    "OSL": "Oslo",
    "PTY": "Panama City",
    "SCL": "Santiago",
    "SHJ": "Sharjah",
    "WAW": "Warsaw",
}

# Pilot logbook notes — evocative + sector stats appended
PILOT_NOTES: dict[str, str] = {
    "ADL": "Southern Australia approaches",
    "AMM": "Desert plateau final",
    "BGW": "Tigris corridor",
    "CAI": "Nile delta from above",
    "DAC": "Monsoon delta approaches",
    "DMM": "Arabian Gulf industrial coast",
    "DXB": "Gulf crossover hub",
    "EBL": "Kurdish highland gateway",
    "ISB": "Margalla foothills",
    "JNB": "Highveld night approaches",
    "KHI": "Arabian Sea coast",
    "KWI": "Gulf state approaches",
    "LHE": "Punjab plains",
    "MAA": "Coromandel coast",
    "OSL": "Fjord approaches",
    "PTY": "Canal zone gateway",
    "SCL": "Andes long final",
    "SHJ": "Emirates coast",
    "WAW": "Vistula basin",
    "STN": "Stansted approaches",
    "IAD": "Dulles corridor",
    "NLU": "Felipe Ángeles highland",
    "NRT": "Narita long final",
    "PKX": "Daxing axis",
}


def city_display_name(iata: str, mwgg_city: str) -> str:
    return CITY_NAME_OVERRIDES.get(iata.upper(), mwgg_city.strip())


def format_note(iata: str, airline: str, sectors: int, block_hrs: float) -> str:
    base = PILOT_NOTES.get(iata.upper())
    stats = f"{sectors} sectors · {block_hrs:.1f} block hrs"
    if base:
        return f"{base} · {stats}"
    return f"{airline} network · {stats}"


def unique_city_id(base: str, existing_ids: set[str]) -> str:
    candidate = slugify(base)
    if candidate not in existing_ids:
        return candidate
    n = 2
    while f"{candidate}-{n}" in existing_ids:
        n += 1
    return f"{candidate}-{n}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", type=Path, default=DEFAULT_INPUT)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    args = parser.parse_args()

    if not args.input.is_file():
        print(f"Input not found: {args.input}", file=sys.stderr)
        return 1

    print("Fetching travel map…")
    map_resp = fetch_json(MAP_URL)
    travel_map = map_resp["data"]

    print("Loading flight stats…")
    flight_data = json.loads(args.input.read_text())
    excel_airports: list[str] = flight_data["uniqueAirports"]
    routes = flight_data["routes"]

    print("Fetching mwgg airports.json…")
    mwgg = build_airports_index(fetch_json(AIRPORTS_URL))

    existing_codes = {
        (c.get("airportCode") or "").upper()
        for c in travel_map["cities"]
        if c.get("airportCode")
    }
    existing_names = {normalize_name(c["name"]) for c in travel_map["cities"]}
    existing_ids = {c["id"] for c in travel_map["cities"]}
    existing_countries = {c["iso2"].upper(): c["name"] for c in travel_map["countries"]}
    used_colors = {c.get("color") for c in travel_map["countries"] if c.get("color")}

    airport_stats, airline = compute_airport_stats(routes)

    already_in_system: list[str] = []
    skipped_duplicates: list[dict] = []
    new_codes: list[str] = []
    lookup_failed: list[str] = []

    for code in excel_airports:
        upper = code.upper()
        if upper in existing_codes:
            already_in_system.append(upper)
            continue

        ap = mwgg.get(upper)
        if not ap:
            lookup_failed.append(upper)
            continue

        if upper in ALT_AIRPORT_CITIES:
            city_name = ALT_AIRPORT_CITIES[upper]["name"]
        else:
            city_name = city_display_name(upper, (ap.get("city") or ap.get("name") or upper))
            if normalize_name(city_name) in existing_names:
                skipped_duplicates.append(
                    {
                        "airportCode": upper,
                        "cityName": city_name,
                        "reason": "city name already on map (different IATA)",
                    }
                )
                continue

        new_codes.append(upper)

    new_cities: list[dict] = []
    new_country_isos: set[str] = set()

    for code in sorted(new_codes):
        ap = mwgg[code]
        alt = ALT_AIRPORT_CITIES.get(code)
        if alt:
            city_name = alt["name"]
            city_id = alt["id"]
            iso2 = alt["country"]
            country_name = alt.get("countryName") or country_display_name(iso2, existing_countries)
        else:
            city_name = city_display_name(code, (ap.get("city") or ap.get("name") or code))
            city_id = unique_city_id(city_name, existing_ids | {c["id"] for c in new_cities})
            iso2 = resolve_iso2(str(ap.get("country") or ""))
            country_name = country_display_name(iso2, existing_countries) if iso2 else None
        if not iso2:
            lookup_failed.append(code)
            continue

        lat = float(ap.get("lat") or 0)
        lng = float(ap.get("lon") or 0)
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            lookup_failed.append(code)
            continue

        st = airport_stats.get(code, {"blockHrs": 0.0, "sectors": 0, "routes": set()})
        sample_routes = sorted(st.get("routes", []))[:5]
        if not alt:
            city_id = unique_city_id(city_name, existing_ids | {c["id"] for c in new_cities})

        entry = {
            "id": city_id,
            "name": city_name,
            "country": iso2,
            "countryName": country_name or country_display_name(iso2, existing_countries),
            "lat": lat,
            "lng": lng,
            "role": "visited",
            "airportCode": code,
            "note": format_note(code, airline, st["sectors"], st["blockHrs"]),
            "_meta": {
                "blockHrs": round(st["blockHrs"], 1),
                "sectors": st["sectors"],
                "sampleRoutes": sample_routes,
            },
        }
        new_cities.append(entry)
        if iso2 not in existing_countries:
            new_country_isos.add(iso2)

    new_countries: list[dict] = []
    color_pool = set(used_colors)
    for iso2 in sorted(new_country_isos):
        color = next_country_color(color_pool, len(existing_countries) + len(new_countries))
        color_pool.add(color)
        new_countries.append(
            {
                "iso2": iso2,
                "name": country_display_name(iso2, existing_countries),
                "visited": True,
                "color": color,
            }
        )

    output = {
        "generatedFrom": str(args.input),
        "summary": {
            "excelAirports": len(excel_airports),
            "excelFlights": len(routes),
            "alreadyInSystem": len(already_in_system),
            "skippedCityDuplicates": len(skipped_duplicates),
            "newCities": len(new_cities),
            "newCountries": len(new_countries),
            "lookupFailed": len(lookup_failed),
        },
        "alreadyInSystem": sorted(already_in_system),
        "skippedDuplicates": skipped_duplicates,
        "lookupFailed": sorted(set(lookup_failed)),
        "countries": new_countries,
        "cities": [{k: v for k, v in c.items() if not k.startswith("_")} for c in new_cities],
    }

    args.output.write_text(json.dumps(output, indent=2, ensure_ascii=False) + "\n")
    print(f"Wrote {args.output}")

    print("\n=== Flight stats import diff ===")
    print(f"Airports in Excel:        {len(excel_airports)}")
    print(f"Flights in Excel:         {len(routes)}")
    print(f"Already in system:        {len(already_in_system)}")
    print(f"  {', '.join(sorted(already_in_system))}")
    print(f"Skipped (city duplicate): {len(skipped_duplicates)}")
    for s in skipped_duplicates:
        print(f"  {s['airportCode']} ({s['cityName']}) — {s['reason']}")
    print(f"NEW to add:               {len(new_cities)}")
    for c in new_cities:
        meta = c["_meta"]
        print(
            f"  {c['airportCode']} → {c['name']} ({c['country']}) "
            f"[{meta['sectors']} sectors, {meta['blockHrs']} hrs]"
        )
    print(f"NEW countries:            {len(new_countries)}")
    for co in new_countries:
        print(f"  {co['iso2']} — {co['name']}")
    if lookup_failed:
        print(f"Lookup failed:            {', '.join(sorted(set(lookup_failed)))}")
    else:
        print("Lookup failed:            (none)")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
