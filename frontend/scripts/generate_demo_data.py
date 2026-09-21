#!/usr/bin/env python3
"""Generates the district-scale demo dataset for E-Rakshan MVP.
Geography: Wayanad, Kerala. Seeded RNG => reproducible scenario."""
import json, random, os
from datetime import datetime, timedelta, timezone

random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), '..', 'public', 'demo-data')
os.makedirs(OUT, exist_ok=True)
NOW = datetime.now(timezone.utc)


def iso(offset_min=0):
    return (NOW - timedelta(minutes=offset_min)).isoformat().replace('+00:00', 'Z')

# ------------------------------------------------------------------ habitations
# name, panchayath, lat, lon, population, elevation, slope, dist_river, drainage, hist, tier
H = [
    ("Kalpetta", "Kalpetta", 11.7130, 76.2050, 31500, 780, 6, 1.8, 0.72, 2, "urban"),
    ("Chooralmala", "Meppadi", 11.6830, 76.1350, 2140, 1120, 31, 0.4, 0.28, 5, "hill"),
    ("Mundakkai", "Meppadi", 11.6780, 76.1280, 1180, 1160, 34, 0.3, 0.22, 6, "hill"),
    ("Attamala", "Meppadi", 11.6880, 76.1420, 940, 1090, 29, 0.5, 0.30, 4, "hill"),
    ("Meppadi", "Meppadi", 11.7000, 76.1450, 5600, 980, 22, 1.1, 0.45, 4, "hill"),
    ("Vythiri", "Vythiri", 11.7450, 76.1550, 3800, 1010, 24, 1.4, 0.55, 3, "hill"),
    ("Lakkidi", "Vythiri", 11.7560, 76.1430, 1750, 930, 26, 1.2, 0.50, 3, "hill"),
    ("Muttil", "Muttil", 11.7050, 76.1850, 7300, 860, 12, 1.6, 0.62, 2, "rural"),
    ("Kambalakkad", "Muttil", 11.6980, 76.2250, 8900, 820, 9, 2.2, 0.66, 3, "rural"),
    ("Vengappally", "Vengappally", 11.6900, 76.1900, 3100, 840, 11, 1.9, 0.60, 2, "rural"),
    ("Thariyode", "Pozhuthana", 11.7200, 76.1000, 2400, 900, 18, 1.0, 0.48, 3, "hill"),
    ("Pozhuthana", "Pozhuthana", 11.7450, 76.0900, 2600, 940, 19, 0.9, 0.46, 3, "hill"),
    ("Thondernad", "Thavinhal", 11.7700, 76.0700, 1900, 960, 21, 1.1, 0.44, 2, "hill"),
    ("Kaniambetta", "Kaniambetta", 11.7350, 76.0900, 4300, 900, 16, 1.3, 0.52, 2, "rural"),
    ("Padinjarethara", "Vythiri", 11.7550, 76.2350, 3400, 880, 13, 1.5, 0.58, 2, "rural"),
    ("Panamaram", "Panamaram", 11.7570, 76.2920, 12400, 790, 7, 0.8, 0.55, 3, "rural"),
    ("Kenichira", "Thavinhal", 11.7750, 76.1500, 5200, 850, 10, 1.7, 0.60, 2, "rural"),
    ("Mananthavady", "Mananthavady", 11.8020, 76.0030, 24100, 760, 6, 1.2, 0.70, 3, "urban"),
    ("Edavaka", "Edavaka", 11.8100, 76.0700, 4100, 800, 8, 1.9, 0.64, 1, "rural"),
    ("Payyampally", "Mananthavady", 11.8200, 76.0400, 3600, 780, 7, 1.4, 0.66, 1, "rural"),
    ("Thirunelly", "Thirunelly", 11.8500, 75.9800, 1600, 920, 17, 1.6, 0.50, 1, "hill"),
    ("Bavali", "Thirunelly", 11.8300, 76.0200, 1400, 830, 12, 0.7, 0.40, 2, "hill"),
    ("Sultan Bathery", "Sultan Bathery", 11.6600, 76.2620, 23500, 850, 8, 2.4, 0.74, 2, "urban"),
    ("Ambalavayal", "Ambalavayal", 11.6370, 76.2170, 7800, 870, 10, 2.0, 0.68, 2, "rural"),
    ("Meenangadi", "Meenangadi", 11.6170, 76.1900, 6900, 840, 14, 1.1, 0.50, 3, "rural"),
    ("Noolpuzha", "Noolpuzha", 11.5850, 76.2350, 3300, 900, 16, 0.9, 0.44, 2, "hill"),
    ("Pulpally", "Pulpally", 11.6070, 76.3180, 9200, 820, 9, 2.6, 0.62, 2, "rural"),
    ("Kidanganad", "Sultan Bathery", 11.6400, 76.3000, 3800, 840, 10, 2.2, 0.64, 1, "rural"),
    ("Nambiarkunnu", "Nambiarkunnu", 11.6200, 76.2800, 2900, 830, 11, 1.8, 0.58, 1, "rural"),
    ("Chekadi", "Muttil", 11.7000, 76.2600, 2200, 810, 9, 1.5, 0.60, 2, "rural"),
    ("Kavumannam", "Kavumannam", 11.6650, 76.1700, 4200, 860, 12, 1.3, 0.56, 2, "rural"),
    ("Purakkadi", "Meppadi", 11.6800, 76.1500, 2800, 880, 13, 1.0, 0.52, 2, "rural"),
    ("Varadoor", "Pulpally", 11.6400, 76.2500, 2500, 850, 9, 2.1, 0.63, 1, "rural"),
    ("Vellarmundi", "Vythiri", 11.7250, 76.1700, 3300, 900, 14, 1.2, 0.54, 2, "rural"),
    ("Poothadi", "Poothadi", 11.6500, 76.1500, 4700, 870, 12, 1.2, 0.55, 2, "rural"),
    ("Nambiarkunnu East", "Nambiarkunnu", 11.6120, 76.2950, 1700, 820, 10, 2.3, 0.60, 1, "rural"),
]


def props_for(name, panch, tier, elev, slope, driver, hist, idx):
    hill = tier == "hill"
    pop_factor = {"urban": 1.0, "rural": 0.8, "hill": 0.55}[tier]
    return {
        "id": f"HAB-{idx:02d}",
        "name": name,
        "panchayath": panch,
        "district": "Wayanad",
        "state": "Kerala",
        "population": int(pop_factor * random.randint(2800, 4200)),
        "households": 0,
        "elderly_pct": round(random.uniform(9, 16 if hill else 13), 1),
        "children_pct": round(random.uniform(10, 19), 1),
        "disabled_pct": round(random.uniform(1.2, 3.4), 1),
        "fragile_housing_pct": round(random.uniform(18, 62) if hill else random.uniform(10, 34), 1),
        "no_vehicle_pct": round(random.uniform(38, 78) if hill else random.uniform(22, 48), 1),
        "dist_hospital_km": round(random.uniform(6, 16) if hill else random.uniform(2, 8), 1),
        "elevation_m": elev,
        "slope_deg": slope,
        "dist_river_km": driver,
        "drainage_index": None,
        "rainfall24_mm": round(random.uniform(18, 78) + (14 if hill else 0), 1),
        "hist_events": hist,
        "event_exposure": round(random.uniform(0.55, 0.95) if hill else random.uniform(0.3, 0.7), 2),
        "census_note": "Census baseline with documented growth estimate — treat as estimate",
    }


hab_features = []
for i, (name, panch, lat, lon, pop, elev, slope, driver, drainage, hist, tier) in enumerate(H, 1):
    p = props_for(name, panch, tier, elev, slope, driver, hist, i)
    p["population"] = pop
    p["households"] = int(pop / random.uniform(3.9, 4.6))
    p["drainage_index"] = drainage
    hab_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": p,
    })

# ------------------------------------------------------------------ red zones
def ring(lon0, lat0, lon1, lat1, jitter=0.012):
    pts = []
    for (dx, dy) in [(-0.7, -0.5), (0.4, -0.8), (0.9, 0.2), (0.3, 0.8), (-0.6, 0.6), (-0.95, 0.0)]:
        pts.append([round((lon0 + (lon1 - lon0) * (dx + 1) / 2) + random.uniform(-jitter, jitter), 4),
                    round((lat0 + (lat1 - lat0) * (dy + 1) / 2) + random.uniform(-jitter, jitter), 4)])
    pts.append(pts[0])
    return [pts]


def pip(lon, lat, poly):
    inside = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
            inside = not inside
        j = i
    return inside


Z = [
    ("RZ-01", "Chooralmala–Mundakkai Slope", "Landslide", 0.82, 0.71, 11.666, 76.118, 11.700, 76.150, "GSI susceptibility + IMD rainfall blend"),
    ("RZ-02", "Banasura Foreshore", "Flash Flood", 0.64, 0.58, 11.730, 76.220, 11.775, 76.270, "NRSC flood layer + river stage"),
    ("RZ-03", "Panamaram Riverine Belt", "Riverine Flood", 0.58, 0.62, 11.740, 76.270, 11.775, 76.315, "CWC stage + DEM low-lying"),
    ("RZ-04", "Kabani Lowlands", "Riverine Flood", 0.52, 0.55, 11.780, 75.975, 11.820, 76.030, "CWC stage + DEM low-lying"),
    ("RZ-05", "Meenangadi Escarpment", "Landslide", 0.47, 0.41, 11.600, 76.175, 11.630, 76.205, "GSI susceptibility"),
    ("RZ-06", "Pulpally Flood Pocket", "Riverine Flood", 0.44, 0.38, 11.590, 76.300, 11.625, 76.340, "NRSC historical inundation"),
    ("RZ-07", "Vythiri Ghat Stretch", "Landslide", 0.61, 0.49, 11.730, 76.125, 11.765, 76.165, "GSI susceptibility + rainfall"),
]

rz_features = []
for zid, name, htype, sev, prob, la0, lo0, la1, lo1, src in Z:
    r = ring(lo0, la0, lo1, la1)
    exposed = sum(h["properties"]["population"] for h in hab_features
                  if pip(h["geometry"]["coordinates"][0], h["geometry"]["coordinates"][1], r[0]))
    rz_features.append({
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": r},
        "properties": {
            "id": zid, "name": name, "hazard_type": htype,
            "severity": sev, "probability": prob,
            "population_exposed": exposed, "source": src,
            "valid_from": iso(15),
        },
    })

# ------------------------------------------------------------------ safe sites
S = [
    ("SITE-01", "Kalpetta Civil Station Complex", "Community Hall", 11.7160, 76.2080, ["water", "medical", "power", "sanitation"], 0.96, 0.88, 0.92, 0.90, 0.85, 0.94),
    ("SITE-02", "SKJSS Higher Secondary Campus", "School Campus", 11.7060, 76.2120, ["water", "sanitation", "power"], 0.93, 0.84, 0.90, 0.86, 0.80, 0.88),
    ("SITE-03", "Banasura Hill Terrace", "Elevated Ground", 11.7530, 76.2420, ["water", "helipad"], 0.97, 0.62, 0.66, 0.88, 0.58, 0.44),
    ("SITE-04", "Sultan Bathery Fort Precinct", "Temple Precinct", 11.6630, 76.2650, ["water", "power", "sanitation", "medical"], 0.94, 0.78, 0.90, 0.88, 0.82, 0.86),
    ("SITE-05", "RARS Ambalavayal Campus", "Institutional Campus", 11.6400, 76.2210, ["water", "medical", "power", "sanitation"], 0.92, 0.86, 0.84, 0.86, 0.88, 0.90),
    ("SITE-06", "Mananthavady Kurichya Ground", "Elevated Ground", 11.8060, 76.0080, ["water", "sanitation"], 0.90, 0.74, 0.88, 0.84, 0.76, 0.70),
    ("SITE-07", "Panamaram School Campus", "School Campus", 11.7590, 76.2880, ["water", "power"], 0.84, 0.80, 0.86, 0.82, 0.78, 0.74),
    ("SITE-08", "Meenangadi Estate Terrace", "Terraced Field", 11.6140, 76.1860, ["water"], 0.88, 0.66, 0.72, 0.84, 0.86, 0.48),
    ("SITE-09", "Pulpally Church Ground", "Community Hall", 11.6100, 76.3150, ["water", "sanitation", "power"], 0.86, 0.72, 0.78, 0.82, 0.80, 0.72),
    ("SITE-10", "Vythiri Ridge Field", "Elevated Ground", 11.7470, 76.1520, ["helipad", "water"], 0.95, 0.58, 0.70, 0.86, 0.54, 0.50),
    ("SITE-11", "Muttil Community Hall", "Community Hall", 11.7080, 76.1870, ["water", "power", "medical"], 0.90, 0.76, 0.88, 0.84, 0.78, 0.82),
    ("SITE-12", "Chundakka Elevated Field", "Elevated Ground", 11.6900, 76.2300, ["water"], 0.89, 0.64, 0.80, 0.80, 0.70, 0.52),
]
site_features = []
for sid, name, typ, lat, lon, am, hz, cap, con, ter, liv, svc in S:
    suit = round((0.30 * hz + 0.20 * cap + 0.15 * con + 0.15 * ter + 0.10 * liv + 0.10 * svc) * 100, 1)
    site_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "id": sid, "name": name, "type": typ, "area_ha": round(random.uniform(1.2, 6.5), 1),
            "hazard_safety": hz, "capacity_score": cap, "connectivity": con,
            "terrain": ter, "livelihood": liv, "services": svc,
            "suitability": suit, "amenities": am,
            "verification": "digitised candidate — requires field verification",
        },
    })

# ------------------------------------------------------------------ shelters
SH = [
    ("SHL-01", "Kalpetta School Relief Centre", "School Relief Centre", 11.7140, 76.2070, 1200, 410, True, 45, True, "DMO Wayanad"),
    ("SHL-02", "Muttil Community Relief Hall", "Community Hall", 11.7070, 76.1860, 600, 180, True, 22, True, "Muttil Panchayath"),
    ("SHL-03", "Kambalakkad Civic Shelter", "Civic Complex", 11.6990, 76.2240, 850, 240, False, 18, True, "Muttil Panchayath"),
    ("SHL-04", "Meppadi Estate School Camp", "School Relief Centre", 11.7010, 76.1460, 700, 520, True, 20, True, "Meppadi Panchayath"),
    ("SHL-05", "Vythiri College Shelter", "Institutional Campus", 11.7440, 76.1560, 550, 120, True, 15, False, "Vythiri Panchayath"),
    ("SHL-06", "Panamaram GLP School Camp", "School Relief Centre", 11.7580, 76.2910, 750, 300, True, 24, True, "Panamaram Panchayath"),
    ("SHL-07", "Mananthavady Centenary Hall", "Community Hall", 11.8010, 76.0050, 900, 260, True, 30, True, "Mananthavady Municipality"),
    ("SHL-08", "Edavaka Relief Camp", "Community Hall", 11.8120, 76.0690, 400, 60, False, 10, True, "Edavaka Panchayath"),
    ("SHL-09", "Sultan Bathery Fort Camp", "Civic Complex", 11.6610, 76.2600, 1100, 350, True, 40, True, "Sultan Bathery Municipality"),
    ("SHL-10", "Ambalavayal RARS Shelter", "Institutional Campus", 11.6380, 76.2180, 650, 150, True, 26, True, "Ambalavayal Panchayath"),
    ("SHL-11", "Meenangadi School Camp", "School Relief Centre", 11.6180, 76.1910, 500, 220, True, 14, True, "Meenangadi Panchayath"),
    ("SHL-12", "Pulpally Parish Hall", "Community Hall", 11.6090, 76.3160, 550, 190, False, 16, True, "Pulpally Panchayath"),
    ("SHL-13", "Noolpuzha Tribal Relief Centre", "Community Hall", 11.5870, 76.2330, 350, 90, True, 9, True, "Noolpuzha Panchayath"),
    ("SHL-14", "Kenichira WHS Camp", "School Relief Centre", 11.7740, 76.1490, 450, 70, True, 12, False, "Thavinhal Panchayath"),
]
sh_features = []
for sid, name, typ, lat, lon, cap, occ, med, water, sani, mgr in SH:
    sh_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "id": sid, "name": name, "type": typ, "capacity": cap, "occupancy": occ,
            "medical_support": med, "water_kl": water, "sanitation_ok": sani,
            "operational": True, "managed_by": mgr,
            "capacity_note": "simulated capacity — requires official verification",
        },
    })

# ------------------------------------------------------------------ roads
def key_of(name):
    for h in H:
        if h[0].lower() == name.lower():
            return h
    return None


def coord(name):
    h = key_of(name)
    return [h[3], h[2]]


R = [
    ("RD-01", "NH-766 Kambalakkad–Kalpetta", "NH", ["Kambalakkad", "Kalpetta"], "open", 0),
    ("RD-02", "NH-766 Kalpetta–Sultan Bathery", "NH", ["Kalpetta", "Chekadi", "Sultan Bathery"], "open", 0),
    ("RD-03", "SH-54 Kalpetta–Panamaram", "SH", ["Kalpetta", "Padinjarethara", "Panamaram"], "open", 0),
    ("RD-04", "SH-54 Panamaram–Mananthavady", "SH", ["Panamaram", "Kenichira", "Mananthavady"], "open", 0),
    ("RD-05", "Mananthavady–Thirunelly Road", "District", ["Mananthavady", "Bavali", "Thirunelly"], "open", 0),
    ("RD-06", "Meppadi–Chooralmala Ghat Road", "District", ["Meppadi", "Chooralmala", "Mundakkai"], "partial", 34),
    ("RD-07", "Chooralmala–Attamala Link", "Village", ["Chooralmala", "Attamala"], "blocked", 95),
    ("RD-08", "NH-766 Lakkidi–Vythiri Ghat", "NH", ["Lakkidi", "Vythiri"], "open", 0),
    ("RD-09", "Kalpetta–Meppadi Road", "District", ["Kalpetta", "Muttil", "Meppadi"], "open", 0),
    ("RD-10", "Sultan Bathery–Ambalavayal Road", "SH", ["Sultan Bathery", "Ambalavayal"], "open", 0),
    ("RD-11", "Ambalavayal–Meenangadi Road", "District", ["Ambalavayal", "Meenangadi"], "open", 0),
    ("RD-12", "Meenangadi–Noolpuzha Road", "District", ["Meenangadi", "Noolpuzha"], "open", 0),
    ("RD-13", "Sultan Bathery–Pulpally Road", "SH", ["Sultan Bathery", "Varadoor", "Pulpally"], "open", 0),
    ("RD-14", "Panamaram–Pozhuthana Village Road", "Village", ["Panamaram", "Kaniambetta", "Thariyode", "Pozhuthana"], "partial", 22),
    ("RD-15", "Mananthavady–Payyampally Road", "District", ["Mananthavady", "Edavaka", "Payyampally"], "open", 0),
    ("RD-16", "Kambalakkad–Vengappally Loop", "Village", ["Kambalakkad", "Vengappally", "Chekadi"], "open", 0),
    ("RD-17", "Mundakkai–Noolpuzha Forest Track", "Village", ["Mundakkai", "Noolpuzha"], "blocked", 120),
    ("RD-18", "Pozhuthana–Thondernad Link", "Village", ["Pozhuthana", "Thondernad"], "open", 0),
    ("RD-19", "Meppadi–Purakkadi Road", "Village", ["Meppadi", "Purakkadi", "Vengappally"], "open", 0),
    ("RD-20", "Sultan Bathery–Nambiarkunnu Road", "Village", ["Sultan Bathery", "Kidanganad", "Nambiarkunnu", "Nambiarkunnu East"], "open", 0),
]
road_features = []
for rid, name, cls, nodes, status, depth in R:
    coords = [coord(n) for n in nodes]
    road_features.append({
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": coords},
        "properties": {
            "id": rid, "name": name, "class": cls, "status": status,
            "flood_depth_cm": depth, "surface": "tarmac",
            "connects": [key_of(n)[0] for n in nodes],
            "osm_note": "OSM baseline network — rural coverage may be incomplete (unknown ≠ safe)",
        },
    })

# ------------------------------------------------------------------ incidents
I = [
    ("INC-01", "Flooded Road", "medium", "unverified", "Citizen SOS", "Kambalakkad junction culvert", "Water crossing the culvert at the junction, two-wheelers stuck.", 34),
    ("INC-02", "Blocked Bridge", "high", "verified", "Field Officer", "Panamaram old bridge", "Debris raft lodged against the central pier; traffic diverted.", 52),
    ("INC-03", "Landslide", "critical", "verified", "Field Officer", "Chooralmala ghat section", "Debris flow across the carriageway, road fully cut at km 4.", 18),
    ("INC-04", "Medical SOS", "critical", "unverified", "Citizen SOS", "Mundakkai", "Elderly patient needs dialysis transport — road cut, requesting helicopter.", 12),
    ("INC-05", "Tree Fall", "medium", "responding", "Field Officer", "Lakkidi NH stretch", "Uprooted tree on the carriageway; PWD crew on site.", 140),
    ("INC-06", "House Collapse", "high", "responding", "Citizen SOS", "Pulpally ward 7", "Partial collapse after continuous rain; family moved to neighbours.", 210),
    ("INC-07", "Flooded Road", "low", "resolved", "Citizen SOS", "Kalpetta bus stand", "Waterlogging receded after pumping.", 300),
    ("INC-08", "River Gauge", "medium", "verified", "Weather Station", "Panamaram gauge", "River crossed warning level; inflow rising.", 26),
]
inc_features = []
for iid, itype, sev, status, source, locname, desc, age in I:
    h = None
    for hh in H:
        if hh[0].lower() in locname.lower() or locname.lower().startswith(hh[0].lower()):
            h = hh
            break
    if h is None:
        h = random.choice(H)
    lon = h[3] + random.uniform(-0.008, 0.008)
    lat = h[2] + random.uniform(-0.008, 0.008)
    inc_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(lon, 4), round(lat, 4)]},
        "properties": {
            "id": iid, "type": itype, "severity": sev, "status": status, "source": source,
            "description": desc, "location_name": locname,
            "reported_at": iso(age), "authority_confirmed": status in ("verified", "responding", "resolved"),
            "confidence": round(random.uniform(0.5, 0.95), 2),
        },
    })

# ------------------------------------------------------------------ write: WAYANAD
def write(sub, fn, features):
    d = os.path.join(OUT, sub)
    os.makedirs(d, exist_ok=True)
    with open(os.path.join(d, fn), "w") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, indent=1)
    print(f"wrote {sub}/{fn}: {len(features)} features")


write("wayanad", "habitations.geojson", hab_features)
write("wayanad", "redzones.geojson", rz_features)
write("wayanad", "safe-sites.geojson", site_features)
write("wayanad", "shelters.geojson", sh_features)
write("wayanad", "roads.geojson", road_features)
write("wayanad", "incidents.geojson", inc_features)

# =====================================================================
# RAIGAD DISTRICT (Konkan Division, Maharashtra) — grounded in the
# attached risk report: Taliye 2021 landslide, Irshalwadi 2023,
# Mahad–Poladpur Savitri belt, Chowk & Nanivali relocation sites.
# =====================================================================
random.seed(84)

RH = [
    # name, taluka, lat, lon, population, elevation, slope, dist_river, drainage, hist, tier
    ("Alibag", "Alibag", 18.6420, 72.8720, 21000, 12, 3, 0.9, 0.74, 3, "urban"),
    ("Panvel", "Panvel", 18.9900, 73.1170, 46000, 28, 4, 1.1, 0.76, 3, "urban"),
    ("Karjat", "Karjat", 18.9100, 73.3250, 29000, 95, 7, 1.2, 0.70, 2, "urban"),
    ("Khopoli", "Khalapur", 18.7850, 73.3450, 22000, 120, 9, 0.9, 0.68, 3, "urban"),
    ("Mahad", "Mahad", 18.0830, 73.4220, 24000, 24, 4, 0.4, 0.42, 6, "urban"),
    ("Roha", "Roha", 18.4400, 73.0800, 19000, 22, 4, 0.8, 0.66, 3, "urban"),
    ("Pen", "Pen", 18.7300, 73.0960, 14000, 35, 5, 1.3, 0.70, 2, "urban"),
    ("Uran", "Uran", 18.8780, 72.9420, 11000, 9, 2, 1.0, 0.72, 1, "urban"),
    ("Mangaon", "Mangaon", 18.2600, 73.2700, 7200, 45, 6, 1.1, 0.62, 3, "rural"),
    ("Nagothana", "Roha", 18.5300, 73.0600, 3400, 18, 4, 0.7, 0.64, 2, "rural"),
    ("Kolad", "Roha", 18.3780, 73.1180, 3600, 30, 6, 0.4, 0.48, 3, "rural"),
    ("Pali", "Pen", 18.7030, 73.2180, 6200, 60, 7, 1.4, 0.66, 2, "rural"),
    ("Mhasla", "Mhasla", 18.1900, 73.0200, 4100, 26, 5, 0.9, 0.60, 2, "rural"),
    ("Shrivardhan", "Shrivardhan", 18.0450, 72.9900, 5200, 14, 4, 0.8, 0.58, 3, "rural"),
    ("Diveagar", "Shrivardhan", 18.0280, 72.9870, 3100, 11, 3, 0.7, 0.60, 2, "rural"),
    ("Murud", "Murud", 18.3280, 72.9400, 5400, 10, 3, 0.8, 0.62, 2, "rural"),
    ("Nizampur", "Mahad", 18.1700, 73.3900, 3600, 55, 9, 1.2, 0.56, 2, "rural"),
    ("Dasgaon", "Mahad", 18.1100, 73.4000, 4800, 18, 4, 0.2, 0.34, 5, "rural"),
    ("Birwadi", "Mahad", 18.1000, 73.3600, 2600, 70, 14, 1.0, 0.50, 3, "rural"),
    ("Pachad", "Mahad", 18.2000, 73.4400, 2200, 130, 16, 1.1, 0.52, 3, "rural"),
    ("Kashid", "Murud", 18.3750, 72.9250, 1800, 8, 3, 0.9, 0.64, 1, "rural"),
    ("Revdanda", "Alibag", 18.5450, 72.9300, 2900, 9, 3, 0.6, 0.66, 2, "rural"),
    ("Thal", "Alibag", 18.6350, 72.8950, 2400, 7, 2, 0.5, 0.70, 1, "rural"),
    ("Khalapur", "Khalapur", 18.8300, 73.2900, 5800, 105, 9, 1.0, 0.60, 2, "rural"),
    ("Chowk", "Khalapur", 18.8000, 73.3000, 4800, 140, 8, 0.9, 0.62, 2, "rural"),
    ("Nanivali", "Khalapur", 18.8150, 73.2750, 950, 180, 14, 0.8, 0.58, 2, "rural"),
    ("Taliye", "Mahad", 18.0450, 73.3850, 780, 210, 27, 0.5, 0.26, 6, "hill"),
    ("Irshalwadi", "Khalapur", 18.8150, 73.3350, 230, 1128, 33, 1.6, 0.30, 4, "hill"),
    ("Ambemachi", "Mahad", 18.2200, 73.4400, 640, 780, 24, 1.2, 0.38, 4, "hill"),
    ("Hirkaniwadi", "Mahad", 18.2320, 73.4330, 410, 800, 26, 1.3, 0.36, 3, "hill"),
    ("Sakhar Sutar Wadi", "Poladpur", 18.0200, 73.4400, 520, 260, 29, 0.7, 0.32, 4, "hill"),
    ("Poladpur", "Poladpur", 17.9880, 73.4650, 6200, 180, 12, 0.7, 0.50, 4, "rural"),
    ("Bhira", "Poladpur", 17.9550, 73.4350, 2900, 95, 21, 0.6, 0.44, 3, "hill"),
]


def rprops_for(name, taluka, tier, elev, slope, driver, hist, idx):
    hill = tier == "hill"
    pop_factor = {"urban": 1.0, "rural": 0.8, "hill": 0.55}[tier]
    return {
        "id": f"HAB-{idx:02d}",
        "name": name,
        "panchayath": taluka,
        "district": "Raigad",
        "state": "Maharashtra",
        "population": int(pop_factor * random.randint(2800, 4200)),
        "households": 0,
        "elderly_pct": round(random.uniform(9, 15 if hill else 13), 1),
        "children_pct": round(random.uniform(10, 19), 1),
        "disabled_pct": round(random.uniform(1.2, 3.2), 1),
        "fragile_housing_pct": round(random.uniform(24, 68) if hill else random.uniform(14, 38), 1),
        "no_vehicle_pct": round(random.uniform(42, 80) if hill else random.uniform(24, 50), 1),
        "dist_hospital_km": round(random.uniform(8, 22) if hill else random.uniform(2, 10), 1),
        "elevation_m": elev,
        "slope_deg": slope,
        "dist_river_km": driver,
        "drainage_index": None,
        "rainfall24_mm": round(random.uniform(30, 95) + (15 if hill else 0), 1),
        "hist_events": hist,
        "event_exposure": round(random.uniform(0.6, 0.95) if hill else random.uniform(0.35, 0.75), 2),
        "census_note": "Census baseline with documented growth estimate — treat as estimate",
    }


rhab_features = []
for i, (name, taluka, lat, lon, pop, elev, slope, driver, drainage, hist, tier) in enumerate(RH, 1):
    p = rprops_for(name, taluka, tier, elev, slope, driver, hist, i)
    p["population"] = pop
    p["households"] = int(pop / random.uniform(3.9, 4.6))
    p["drainage_index"] = drainage
    rhab_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": p,
    })

# Red zones — ranks from the risk report (§3)
RZ2 = [
    ("RZ-01", "Taliye (Kondhalkar) Slope", "Landslide", 0.85, 0.72, 18.030, 73.360, 18.062, 73.405, "GSI most-vulnerable · 2021 event (~85 deaths)"),
    ("RZ-02", "Irshalwadi–Irshalgad Slope", "Landslide", 0.84, 0.68, 18.800, 73.310, 18.832, 73.350, "Mapping-gap zone — absent from pre-2023 GSI list"),
    ("RZ-03", "Mahad–Poladpur Savitri Belt", "Riverine Flood", 0.78, 0.75, 17.980, 73.380, 18.125, 73.460, "CWC stage history (8.25m → 11.72m record)"),
    ("RZ-04", "Ambemachi–Hirkaniwadi Slope", "Landslide", 0.68, 0.55, 18.210, 73.420, 18.242, 73.462, "GSI-flagged · 87 evacuated (2021)"),
    ("RZ-05", "Kundalika Release Belt (Kolad–Roha)", "Flash Flood", 0.62, 0.52, 18.360, 73.050, 18.460, 73.140, "Dam-release protocol + catchment rainfall"),
    ("RZ-06", "Patalganga Lowlands (Khalapur–Panvel)", "Riverine Flood", 0.56, 0.50, 18.830, 73.100, 18.995, 73.280, "Industrial-corridor drainage deficit"),
    ("RZ-07", "Murud–Shrivardhan Coast", "Coastal Surge", 0.50, 0.45, 18.020, 72.920, 18.360, 73.010, "Tidal surge + monsoon spring-tide overlap"),
]

rrz_features = []
for zid, name, htype, sev, prob, la0, lo0, la1, lo1, src in RZ2:
    r = ring(lo0, la0, lo1, la1)
    exposed = sum(h["properties"]["population"] for h in rhab_features
                  if pip(h["geometry"]["coordinates"][0], h["geometry"]["coordinates"][1], r[0]))
    rrz_features.append({
        "type": "Feature",
        "geometry": {"type": "Polygon", "coordinates": r},
        "properties": {
            "id": zid, "name": name, "hazard_type": htype,
            "severity": sev, "probability": prob,
            "population_exposed": exposed, "source": src,
            "valid_from": iso(15),
        },
    })

# Safe sites — Chowk & Nanivali from the report's comparative assessment (§4)
RS = [
    ("SITE-01", "Chowk Interim Relief Site", "Container Township", 18.8000, 73.3000, ["water", "sanitation", "power"], 0.90, 0.55, 0.97, 0.90, 0.35, 0.80),
    ("SITE-02", "Nanivali Rehabilitation Site (CIDCO)", "Permanent Settlement", 18.8150, 73.2750, ["water", "sanitation", "power", "medical"], 0.93, 0.80, 0.85, 0.85, 0.80, 0.82),
    ("SITE-03", "Mahad Municipal Relief Ground", "Community Hall", 18.0860, 73.4250, ["water", "medical", "power", "sanitation"], 0.92, 0.86, 0.90, 0.88, 0.82, 0.90),
    ("SITE-04", "Alibag Civil Station Campus", "Institutional Campus", 18.6440, 72.8750, ["water", "medical", "power", "sanitation"], 0.94, 0.84, 0.88, 0.90, 0.84, 0.92),
    ("SITE-05", "Karjat College Campus", "School Campus", 18.9120, 73.3280, ["water", "sanitation", "power"], 0.92, 0.82, 0.92, 0.86, 0.80, 0.86),
    ("SITE-06", "Khopoli Civic Ground", "Civic Complex", 18.7870, 73.3480, ["water", "power", "sanitation"], 0.90, 0.76, 0.94, 0.86, 0.78, 0.82),
    ("SITE-07", "Roha Stadium Ground", "Elevated Ground", 18.4420, 73.0820, ["water", "sanitation"], 0.90, 0.72, 0.84, 0.84, 0.78, 0.74),
    ("SITE-08", "Mangaon Panchayat Campus", "School Campus", 18.2620, 73.2720, ["water", "power"], 0.88, 0.74, 0.82, 0.84, 0.82, 0.76),
    ("SITE-09", "Murud High School Campus", "School Campus", 18.3300, 72.9420, ["water", "power"], 0.85, 0.74, 0.78, 0.82, 0.76, 0.72),
    ("SITE-10", "Pen Panchayat Hall", "Community Hall", 18.7320, 73.0980, ["water", "power", "medical"], 0.89, 0.72, 0.88, 0.84, 0.78, 0.80),
    ("SITE-11", "Panvel CIDCO Community Hall", "Community Hall", 18.9920, 73.1200, ["water", "medical", "power", "sanitation"], 0.90, 0.80, 0.96, 0.88, 0.74, 0.90),
    ("SITE-12", "Shrivardhan Community Ground", "Elevated Ground", 18.0470, 72.9920, ["water"], 0.82, 0.62, 0.74, 0.84, 0.72, 0.58),
]
rsite_features = []
for sid, name, typ, lat, lon, am, hz, cap, con, ter, liv, svc in RS:
    suit = round((0.30 * hz + 0.20 * cap + 0.15 * con + 0.15 * ter + 0.10 * liv + 0.10 * svc) * 100, 1)
    rsite_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "id": sid, "name": name, "type": typ, "area_ha": round(random.uniform(1.0, 6.0), 1),
            "hazard_safety": hz, "capacity_score": cap, "connectivity": con,
            "terrain": ter, "livelihood": liv, "services": svc,
            "suitability": suit, "amenities": am,
            "verification": "digitised candidate — requires field verification",
        },
    })

RSH = [
    ("SHL-01", "Mahad Municipal Relief Centre", "Civic Complex", 18.0850, 73.4240, 1000, 320, True, 38, True, "Mahad Municipal Council"),
    ("SHL-02", "Alibag School Relief Centre", "School Relief Centre", 18.6430, 72.8740, 900, 260, True, 30, True, "Alibag Municipal Council"),
    ("SHL-03", "Panvel Community Hall", "Community Hall", 18.9910, 73.1180, 1100, 380, True, 42, True, "Panvel Municipal Corporation"),
    ("SHL-04", "Karjat College Camp", "Institutional Campus", 18.9110, 73.3270, 800, 210, True, 26, True, "Karjat Municipal Council"),
    ("SHL-05", "Khopoli Civic Shelter", "Civic Complex", 18.7860, 73.3460, 700, 240, False, 18, True, "Khalapur Taluka"),
    ("SHL-06", "Roha School Camp", "School Relief Centre", 18.4410, 73.0810, 600, 150, True, 20, True, "Roha Taluka"),
    ("SHL-07", "Chowk Container Township", "Interim Relief Site", 18.8005, 73.3010, 240, 180, True, 12, True, "CIDCO"),
    ("SHL-08", "Nanivali Transit Homes", "Permanent Rehabilitation", 18.8155, 73.2760, 180, 132, True, 10, True, "CIDCO"),
    ("SHL-09", "Mangaon Panchayat Hall", "Community Hall", 18.2610, 73.2710, 450, 90, False, 12, True, "Mangaon Panchayat"),
    ("SHL-10", "Murud School Relief Centre", "School Relief Centre", 18.3290, 72.9410, 550, 160, True, 16, True, "Murud Panchayat"),
    ("SHL-11", "Pen Civic Complex", "Civic Complex", 18.7310, 73.0970, 500, 120, True, 14, True, "Pen Taluka"),
    ("SHL-12", "Poladpur Hill School Camp", "School Relief Centre", 17.9900, 73.4670, 400, 110, True, 11, True, "Poladpur Panchayat"),
    ("SHL-13", "Uran Municipal Hall", "Community Hall", 18.8790, 72.9430, 500, 70, False, 13, True, "Uran Municipal Council"),
    ("SHL-14", "Shrivardhan Community Shelter", "Community Hall", 18.0460, 72.9910, 350, 95, True, 9, True, "Shrivardhan Panchayat"),
]
rsh_features = []
for sid, name, typ, lat, lon, cap, occ, med, water, sani, mgr in RSH:
    rsh_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [lon, lat]},
        "properties": {
            "id": sid, "name": name, "type": typ, "capacity": cap, "occupancy": occ,
            "medical_support": med, "water_kl": water, "sanitation_ok": sani,
            "operational": True, "managed_by": mgr,
            "capacity_note": "simulated capacity — requires official verification",
        },
    })


def rkey_of(name):
    for h in RH:
        if h[0].lower() == name.lower():
            return h
    return None


def rcoord(name):
    h = rkey_of(name)
    return [h[3], h[2]]


RR = [
    ("RD-01", "NH-66 Panvel–Nagothana", "NH", ["Panvel", "Nagothana"], "open", 0),
    ("RD-02", "NH-66 Nagothana–Kolad", "NH", ["Nagothana", "Kolad"], "open", 0),
    ("RD-03", "NH-66 Kolad–Mangaon–Mahad", "NH", ["Kolad", "Mangaon", "Mahad"], "partial", 26),
    ("RD-04", "NH-66 Mahad–Kashedi–Poladpur", "NH", ["Mahad", "Sakhar Sutar Wadi", "Poladpur"], "open", 0),
    ("RD-05", "Mumbai–Alibag Coastal Highway", "SH", ["Panvel", "Thal", "Alibag"], "open", 0),
    ("RD-06", "Alibag–Revdanda–Murud Coast Road", "District", ["Alibag", "Revdanda", "Murud"], "partial", 18),
    ("RD-07", "Murud–Mhasla–Shrivardhan Road", "District", ["Murud", "Mhasla", "Shrivardhan"], "open", 0),
    ("RD-08", "Shrivardhan–Diveagar Beach Road", "Village", ["Shrivardhan", "Diveagar"], "blocked", 70),
    ("RD-09", "Nagothana–Roha Road", "SH", ["Nagothana", "Roha"], "open", 0),
    ("RD-10", "Roha–Kolad Road", "District", ["Roha", "Kolad"], "open", 0),
    ("RD-11", "Kolad–Bhira Ghat Road", "District", ["Kolad", "Bhira"], "partial", 32),
    ("RD-12", "Mahad–Dasgaon–Taliye Road", "District", ["Mahad", "Dasgaon", "Taliye"], "blocked", 105),
    ("RD-13", "Mahad–Pachad–Ambemachi Road", "District", ["Mahad", "Pachad", "Ambemachi"], "partial", 40),
    ("RD-14", "Taliye–Birwadi Hill Link", "Village", ["Taliye", "Birwadi"], "blocked", 90),
    ("RD-15", "Mangaon–Nizampur–Birwadi Link", "Village", ["Mangaon", "Nizampur", "Birwadi"], "open", 0),
    ("RD-16", "Pen–Pali Road", "District", ["Pen", "Pali"], "open", 0),
    ("RD-17", "Pali–Khopoli Road", "District", ["Pali", "Khopoli"], "open", 0),
    ("RD-18", "Khopoli–Chowk–Karjat (NH-4)", "NH", ["Khopoli", "Chowk", "Karjat"], "open", 0),
    ("RD-19", "Chowk–Nanivali–Irshalwadi Trailhead", "Village", ["Chowk", "Nanivali", "Irshalwadi"], "partial", 15),
    ("RD-20", "Panvel–Uran Road", "District", ["Panvel", "Uran"], "open", 0),
    ("RD-21", "Khalapur–Morbe–Nanivali Road", "District", ["Khalapur", "Nanivali"], "open", 0),
    ("RD-22", "Diveagar–Mhasla Village Road", "Village", ["Diveagar", "Mhasla"], "open", 0),
]
rroad_features = []
for rid, name, cls, nodes, status, depth in RR:
    rroad_features.append({
        "type": "Feature",
        "geometry": {"type": "LineString", "coordinates": [rcoord(n) for n in nodes]},
        "properties": {
            "id": rid, "name": name, "class": cls, "status": status,
            "flood_depth_cm": depth, "surface": "tarmac",
            "connects": [rkey_of(n)[0] for n in nodes],
            "osm_note": "OSM baseline network — rural coverage may be incomplete (unknown ≠ safe)",
        },
    })

RI = [
    ("INC-01", "River Gauge", "high", "verified", "Weather Station", "Savitri at Dasgaon", "Savitri crossed 10.9 m at Dasgaon gauge — above warning stage, rising 9 cm/hr.", 28),
    ("INC-02", "Landslide", "critical", "verified", "Field Officer", "Kashedi Ghat (NH-66)", "Debris flow across the carriageway at Kashedi ghat; one lane cut, PWD clearing.", 21),
    ("INC-03", "Medical SOS", "critical", "unverified", "Citizen SOS", "Taliye (Kondhalkar)", "Elderly resident needs evacuation — approach road cut by slope debris.", 14),
    ("INC-04", "Blocked Bridge", "high", "unverified", "Citizen SOS", "Kolad suspension bridge", "Kundalika suspension bridge closed after dam release surge; approach flooded.", 47),
    ("INC-05", "Flooded Road", "medium", "responding", "Field Officer", "Murud–Mhasla section", "Tidal water over carriageway near Nanij; traffic controlled.", 160),
    ("INC-06", "House Collapse", "high", "responding", "Citizen SOS", "Mahad ward 4", "Wall collapse after seepage; family shifted to municipal relief centre.", 230),
    ("INC-07", "Flooded Road", "low", "resolved", "Citizen SOS", "Panvel market", "Waterlogging receded after pumping.", 300),
    ("INC-08", "Landslide", "medium", "verified", "Satellite Pass", "Ambemachi slope", "Fresh scarps upslope of Ambemachi in post-rainfall imagery — field check advised.", 70),
]
rinc_features = []
for iid, itype, sev, status, source, locname, desc, age in RI:
    h = None
    for hh in RH:
        key = locname.split()[0].split("(")[0].strip().lower()
        if key in hh[0].lower() or hh[0].lower() in locname.lower():
            h = hh
            break
    if h is None:
        h = random.choice(RH)
    lon = h[3] + random.uniform(-0.008, 0.008)
    lat = h[2] + random.uniform(-0.008, 0.008)
    rinc_features.append({
        "type": "Feature",
        "geometry": {"type": "Point", "coordinates": [round(lon, 4), round(lat, 4)]},
        "properties": {
            "id": iid, "type": itype, "severity": sev, "status": status, "source": source,
            "description": desc, "location_name": locname,
            "reported_at": iso(age), "authority_confirmed": status in ("verified", "responding", "resolved"),
            "confidence": round(random.uniform(0.5, 0.95), 2),
        },
    })

write("raigad", "habitations.geojson", rhab_features)
write("raigad", "redzones.geojson", rrz_features)
write("raigad", "safe-sites.geojson", rsite_features)
write("raigad", "shelters.geojson", rsh_features)
write("raigad", "roads.geojson", rroad_features)
write("raigad", "incidents.geojson", rinc_features)
print("done.")
