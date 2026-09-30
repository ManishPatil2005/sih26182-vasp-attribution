from typing import List, Dict, Any, Optional
from fastapi import APIRouter, Query, HTTPException, Body
from pydantic import BaseModel, Field

from app.engines.disruption_engine import disruption_planner
from app.engines.agency_rbac import agency_rbac, AgencyProfile
from app.models.schemas import DisruptionImpact, DisruptionRecommendation
from app.storage.graph_engine import graph_engine

router = APIRouter()


class DisruptionSimulateRequest(BaseModel):
    target_node_ids: List[str]


@router.post("/simulate", response_model=DisruptionImpact)
async def simulate_syndicate_disruption(req: DisruptionSimulateRequest):
    """
    Simulates the interdiction/arrest of a set of suspects:
    Computes network percolation, severed channels, remaining giant component,
    and Syndicate Disruption Index (SDI).
    """
    impact = disruption_planner.simulate_interdiction(
        target_node_ids=req.target_node_ids,
        graph_engine=graph_engine
    )
    return impact


@router.get("/optimal-targets", response_model=List[DisruptionRecommendation])
async def get_optimal_arrest_recommendations(top_k: int = Query(default=3, ge=1, le=10)):
    """
    Calculates the mathematically optimal set of simultaneous arrests
    to achieve maximal syndicate fragmentation (highest SDI).
    Identifies articulation points (cut vertices).
    """
    recs = disruption_planner.get_optimal_disruption_recommendations(
        graph_engine=graph_engine,
        top_k=top_k
    )
    return recs


@router.get("/articulation-points", response_model=List[str])
async def get_articulation_points():
    """
    Returns single points of failure (cut vertices):
    Suspects whose individual interdiction instantly fractures the syndicate.
    """
    return disruption_planner.find_articulation_points(graph_engine=graph_engine)


@router.get("/agencies", response_model=List[AgencyProfile])
async def get_agency_profiles():
    """
    Returns available security clearance profiles for multi-agency collaboration.
    """
    return agency_rbac.get_agency_profiles()
