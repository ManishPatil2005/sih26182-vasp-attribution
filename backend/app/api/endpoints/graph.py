from typing import Optional
from fastapi import APIRouter, Query, HTTPException, Form, Header
from app.models.schemas import GraphData, GraphNode
from app.storage.graph_engine import graph_engine
from app.storage.audit_ledger import audit_ledger
from app.engines.demo_loader import load_operation_chakra_net
from app.engines.agency_rbac import agency_rbac
from app.engines.auth_engine import auth_engine
from app.core.config import settings

router = APIRouter()


def _resolve_officer(officer_id: str, authorization: Optional[str] = None) -> str:
    """Extracts verified officer badge from JWT Bearer token if present."""
    if authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = auth_engine.verify_jwt_token(token)
        if payload and payload.get("sub"):
            return f"{payload.get('name', 'Officer')} ({payload.get('sub')})"
    return officer_id


@router.post("/load-demo")
async def trigger_load_demo(
    officer_id: str = Form(settings.DEFAULT_IO_NAME),
    authorization: Optional[str] = Header(None)
):
    """
    Loads synthetic 'Operation Chakra-Net' dataset into the Knowledge Graph.
    Attributed to authenticated officer badge in Section 63 BSA audit ledger.
    """
    effective_officer = _resolve_officer(officer_id, authorization)
    node_count = load_operation_chakra_net(officer_id=effective_officer)
    return {
        "success": True,
        "nodes_loaded": node_count,
        "scenario": "Operation Chakra-Net (MHA SIH PS 26189 Benchmark)",
        "message": f"Successfully loaded synthetic criminal syndicate network with {node_count} nodes."
    }


@router.post("/load-rakshak")
async def trigger_load_rakshak(
    officer_id: str = Form(settings.DEFAULT_IO_NAME),
    authorization: Optional[str] = Header(None)
):
    """
    Loads 'Operation Rakshak' (NCRB Women Safety Priority Syndicate) into the Knowledge Graph.
    Attributed to authenticated officer badge in Section 63 BSA audit ledger.
    """
    from app.engines.ncrb_scenario import load_ncrb_operation_rakshak
    effective_officer = _resolve_officer(officer_id, authorization)
    res = load_ncrb_operation_rakshak()
    audit_ledger.append_entry(
        officer_id=effective_officer,
        action="LOAD_NCRB_OPERATION_RAKSHAK",
        target_id="GRAPH_ROOT",
        payload=res
    )
    return {
        "success": True,
        **res
    }


@router.post("/load-fun")
async def trigger_load_fun(
    officer_id: str = Form(settings.DEFAULT_IO_NAME),
    authorization: Optional[str] = Header(None)
):
    """
    Loads 'fun.csv' (Gov Intercept CDR Surveillance between Krish, Manish, and Afnan)
    directly into the live Knowledge Graph.
    """
    from pathlib import Path
    from app.engines.ingestion import ingestion_engine

    candidates = [
        Path("data/raw/fun.csv"),
        Path("../data/raw/fun.csv"),
        Path("fun.csv"),
        Path("../fun.csv"),
        Path(__file__).resolve().parents[3] / "data" / "raw" / "fun.csv",
        Path(__file__).resolve().parents[3] / "fun.csv",
    ]
    fun_path = next((p for p in candidates if p.exists()), None)
    if not fun_path:
        raise HTTPException(status_code=404, detail="fun.csv not found on server.")

    effective_officer = _resolve_officer(officer_id, authorization)
    content = fun_path.read_bytes()
    nodes, edges, response = ingestion_engine.process_cdr_csv(
        content=content,
        filename="fun.csv",
        officer_id=effective_officer
    )
    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)

    return {
        "success": True,
        "nodes_loaded": len(nodes),
        "edges_loaded": len(edges),
        "scenario": "Gov Intercept Monitoring: Krish, Manish & Afnan (fun.csv)",
        "message": f"Successfully loaded fun.csv with {len(nodes)} entities and {len(edges)} connections."
    }


@router.get("/data", response_model=GraphData)
async def get_graph_data(
    agency_code: Optional[str] = Query(None, description="Agency security clearance code (e.g. STATE_POLICE_IO, MHA_APEX_COMMAND)"),
    authorization: Optional[str] = Header(None)
):
    """
    Returns complete Knowledge Graph data (nodes and edges) formatted for Cytoscape.js canvas rendering.
    Enforces Multi-Agency RBAC under Official Secrets Act & Section 63 BSA 2023:
    If agency clearance is non-apex (e.g. STATE_POLICE_IO), covert/undercover assets are redacted.
    """
    resolved_agency = agency_code
    if not resolved_agency and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = auth_engine.verify_jwt_token(token)
        if payload:
            resolved_agency = payload.get("agency")

    nodes = list(graph_engine.node_store.values())
    edges = list(graph_engine.edge_store.values())
    raw_graph = GraphData(
        nodes=nodes,
        edges=edges,
        metadata={
            "total_nodes": len(nodes),
            "total_edges": len(edges),
            "engine": settings.GRAPH_ENGINE
        }
    )

    if resolved_agency:
        return agency_rbac.sanitize_graph_for_agency(raw_graph, resolved_agency)
    return raw_graph


@router.get("/temporal", response_model=GraphData)
async def get_temporal_graph(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    agency_code: Optional[str] = Query(None, description="Agency security clearance code"),
    authorization: Optional[str] = Header(None)
):
    """
    Network Time Machine endpoint:
    Returns the dynamic graph state within a specific temporal window, sanitized for agency clearance.
    """
    resolved_agency = agency_code
    if not resolved_agency and authorization and authorization.startswith("Bearer "):
        token = authorization.split(" ", 1)[1].strip()
        payload = auth_engine.verify_jwt_token(token)
        if payload:
            resolved_agency = payload.get("agency")

    nodes, edges = graph_engine.query_temporal_subgraph(start_date=start_date, end_date=end_date)
    raw_graph = GraphData(
        nodes=nodes,
        edges=edges,
        metadata={
            "start_date": start_date,
            "end_date": end_date,
            "active_nodes": len(nodes),
            "active_edges": len(edges)
        }
    )

    if resolved_agency:
        return agency_rbac.sanitize_graph_for_agency(raw_graph, resolved_agency)
    return raw_graph


@router.get("/node/{node_id}", response_model=GraphNode)
async def get_node_details(node_id: str):
    """
    Retrieves full intelligence details, risk score, centrality,
    and source evidence references for a specific node.
    """
    if node_id not in graph_engine.node_store:
        raise HTTPException(status_code=404, detail=f"Node '{node_id}' not found.")
    return graph_engine.node_store[node_id]


@router.post("/clear")
async def clear_graph(
    officer_id: str = Form(settings.DEFAULT_IO_NAME),
    authorization: Optional[str] = Header(None)
):
    """Resets the in-memory graph for fresh ingestion with Section 63 BSA audit attribution."""
    effective_officer = _resolve_officer(officer_id, authorization)
    graph_engine.clear()
    audit_ledger.append_entry(
        officer_id=effective_officer,
        action="CLEAR_GRAPH_DATABASE",
        target_id="GRAPH_ROOT",
        payload={"action": "RESET"}
    )
    return {"success": True, "message": "Knowledge graph cleared."}
