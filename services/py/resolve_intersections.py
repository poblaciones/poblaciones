"""
Calcula, para cada geometría candidata (gei_geometry), el porcentaje de su área
que queda cubierto por la intersección con cli_geometry.

Reemplaza la lógica de MySQL:
    ST_Intersection(ST_Buffer(cli_geometry, 0), ST_Buffer(gei_geometry, 0))
    GeometryAreaSphere(...)

Decisiones de implementación:
- La intersección se calcula en plano cartesiano con Shapely (mismo comportamiento
  que MySQL 5.7, que no interpreta las coordenadas como geodésicas al operar
  ST_Intersection).
- No se aplica buffer(0) ni corrección de validez: se asume que las geometrías
  de entrada (Polygon o MultiPolygon, con o sin huecos) son válidas.
- El área se calcula en forma geodésica con pyproj.Geod, que trabaja directamente
  sobre coordenadas en grados (lon/lat) sin requerir una proyección intermedia.
  Esto replica el comportamiento de GeometryAreaSphere.

Entrada esperada (JSON), por stdin o archivo:
{
  "cli_geometry": "POLYGON((...))",          // WKT, SRID 4326 (lon/lat)
  "candidates": [
    {"gei_id": 123, "gei_geometry": "POLYGON((...))"},
    ...
  ]
}

Salida (JSON):
{
  "results": [
    {"gei_id": 123, "pct": 87.32},
    ...
  ]
}

Filas con geometría inválida o error de cálculo se omiten y se reportan
en "errors".
"""

import sys
import json

from shapely import wkt
from shapely.geometry.base import BaseGeometry
from pyproj import Geod

GEOD = Geod(ellps="WGS84")


def geodesic_area(geom: BaseGeometry) -> float:
    """Área geodésica absoluta (m²) de un Polygon o MultiPolygon en lon/lat."""
    if geom.is_empty:
        return 0.0
    if geom.geom_type == "Polygon":
        area, _ = GEOD.geometry_area_perimeter(geom)
        return abs(area)
    if geom.geom_type == "MultiPolygon":
        return sum(geodesic_area(p) for p in geom.geoms)
    # GeometryCollection u otros tipos degenerados producto de la intersección
    if geom.geom_type == "GeometryCollection":
        return sum(
            geodesic_area(g) for g in geom.geoms
            if g.geom_type in ("Polygon", "MultiPolygon")
        )
    return 0.0


def safe_load(wkt_str: str) -> BaseGeometry:
    return wkt.loads(wkt_str)


def procesar(data: dict) -> dict:
    cli_geom = safe_load(data["cli_geometry"])
    base_area = geodesic_area(cli_geom)

    results = []
    errors = []
    if (base_area > 0):
        for cand in data["candidates"]:
            gei_id = cand["gei_id"]
            try:
                gei_geom = safe_load(cand["gei_geometry"])

                inter = cli_geom.intersection(gei_geom)
                inter_area = geodesic_area(inter)
                if (inter_area > 0):
                    gei_area = geodesic_area(gei_geom)

                    pct = (inter_area / gei_area) * 100
                    pct_of_base = (inter_area / base_area) * 100

                    results.append({"gei_id": gei_id, "pct": round(pct, 4), "pct_of_base": pct_of_base})

            except Exception as e:
                errors.append({"gei_id": gei_id, "error": str(e)})

    return {"results": results, "errors": errors}


def main():
    if len(sys.argv) > 1:
        with open(sys.argv[1], encoding="utf-8") as f:
            data = json.load(f)
    else:
        data = json.load(sys.stdin)

    output = procesar(data)
    json.dump(output, sys.stdout, ensure_ascii=False)


if __name__ == "__main__":
    main()
