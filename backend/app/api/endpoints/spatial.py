from fastapi import APIRouter, Query
from typing import Dict, Any
from app.engines.colocation_engine import colocation_engine

router = APIRouter()


@router.post("/colocation")
def analyze_colocations(
    time_window_minutes: int = Query(default=15, ge=1, le=120),
    max_distance_meters: float = Query(default=300.0, ge=50.0, le=5000.0)
) -> Dict[str, Any]:
    """
    Performs spatio-temporal co-location analysis on cellular tower dump pings.
    Identifies covert physical rendezvous between suspects within specified time/distance thresholds.
    """
    rendezvous_events = colocation_engine.analyze_colocations(
        time_window_minutes=time_window_minutes,
        max_distance_meters=max_distance_meters
    )
    return {
        "status": "SUCCESS",
        "time_window_minutes": time_window_minutes,
        "max_distance_meters": max_distance_meters,
        "rendezvous_events_count": len(rendezvous_events),
        "rendezvous_events": rendezvous_events,
    }


@router.get("/gis-map")
def get_gis_map_data() -> Dict[str, Any]:
    """
    Returns geo-spatial intelligence: cell towers, suspect trajectories,
    and rendezvous hotspots for interactive GIS map visualization.
    """
    data = colocation_engine.get_towers_and_trajectories()
    return {
        "status": "SUCCESS",
        **data
    }
