from typing import List
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from app.models.schemas import IngestResponse, SplinkMergeCandidate
from app.engines.ingestion import ingestion_engine
from app.engines.identity_fusion import identity_fusion
from app.storage.graph_engine import graph_engine
from app.core.config import settings

router = APIRouter()


@router.post("/cdr", response_model=IngestResponse)
async def ingest_cdr(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest Call Detail Records (CDR) CSV file.
    Extracts phone nodes, durations, tower locations, and CALLED relationships.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported for CDR ingestion.")

    content = await file.read()
    nodes, edges, response = ingestion_engine.process_cdr_csv(
        content=content,
        filename=file.filename,
        officer_id=officer_id
    )

    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)

    return response


@router.post("/bank", response_model=IngestResponse)
async def ingest_bank(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest Bank Transaction CSV file.
    Extracts bank accounts, UTR numbers, amounts, and TRANSFERRED_MONEY edges.
    """
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files supported for bank ingestion.")

    content = await file.read()
    nodes, edges, response = ingestion_engine.process_bank_csv(
        content=content,
        filename=file.filename,
        officer_id=officer_id
    )

    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)

    return response


@router.post("/fir", response_model=IngestResponse)
async def ingest_fir(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest Police FIR or Interrogation Document (PDF or TXT).
    Extracts suspects, aliases, phone numbers, vehicles, and IPC/BNS sections.
    """
    is_pdf = file.filename.lower().endswith(".pdf")
    is_txt = file.filename.lower().endswith(".txt")

    if not (is_pdf or is_txt):
        raise HTTPException(status_code=400, detail="Supported formats: PDF or TXT.")

    content = await file.read()
    nodes, edges, response = ingestion_engine.process_fir_document(
        content=content,
        filename=file.filename,
        officer_id=officer_id,
        is_pdf=is_pdf
    )

    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)

    return response


@router.post("/surveillance", response_model=IngestResponse)
async def ingest_surveillance(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest Physical Surveillance Logs & Stakeout Reports (TXT/CSV).
    Extracts observed suspects, vehicle movements, and safehouse sightings.
    """
    content = await file.read()
    nodes, edges, response = ingestion_engine.process_surveillance_report(
        content=content,
        filename=file.filename,
        officer_id=officer_id
    )
    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)
    return response


@router.post("/criminal-history", response_model=IngestResponse)
async def ingest_criminal_history(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest CCTNS / ICJS Criminal History Database Dossier (TXT/PDF/CSV).
    Integrates prior convictions, past FIRs, and updates habitual offender threat risks.
    """
    content = await file.read()
    nodes, edges, response = ingestion_engine.process_criminal_history(
        content=content,
        filename=file.filename,
        officer_id=officer_id
    )
    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)
    return response


@router.post("/intelligence", response_model=IngestResponse)
async def ingest_intelligence(
    file: UploadFile = File(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Ingest Multi-Agency Center (MAC) / Intelligence Agency Secret Bulletins.
    Maps interstate criminal networks, arms/funds conduits, and syndicate alerts.
    """
    content = await file.read()
    nodes, edges, response = ingestion_engine.process_intelligence_bulletin(
        content=content,
        filename=file.filename,
        officer_id=officer_id
    )
    for node in nodes:
        graph_engine.add_node(node)
    for edge in edges:
        graph_engine.add_edge(edge)
    return response


@router.get("/fusion/candidates", response_model=List[SplinkMergeCandidate])
async def get_fusion_candidates():
    """
    Runs Splink probabilistic record linkage across all current nodes,
    identifying aliases and duplicate suspects needing merge or human triage.
    """
    current_nodes = list(graph_engine.node_store.values())
    return identity_fusion.find_all_candidates(current_nodes)


@router.post("/fusion/merge")
async def execute_merge(
    canonical_id: str = Form(...),
    duplicate_id: str = Form(...),
    officer_id: str = Form(settings.DEFAULT_IO_NAME)
):
    """
    Executes entity merge: rewires edges, merges aliases, and logs to SHA-256 ledger.
    """
    success = graph_engine.merge_nodes(
        canonical_id=canonical_id,
        duplicate_id=duplicate_id,
        officer_id=officer_id
    )
    if not success:
        raise HTTPException(status_code=404, detail="One or both entity IDs not found.")

    return {
        "success": True,
        "message": f"Successfully merged {duplicate_id} into canonical entity {canonical_id}."
    }
