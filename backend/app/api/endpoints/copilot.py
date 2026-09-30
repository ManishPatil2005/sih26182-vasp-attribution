from fastapi import APIRouter
from pydantic import BaseModel
from typing import Dict, Any, Optional
from app.engines.copilot_engine import copilot_engine

router = APIRouter()


class CopilotQueryRequest(BaseModel):
    query: str


@router.post("/query")
def ask_copilot(req: CopilotQueryRequest) -> Dict[str, Any]:
    """
    Natural Language Investigator Copilot query interface.
    Answers natural language questions about the active Crime Graph,
    returns actionable investigative recommendations and highlighted nodes/edges.
    """
    response = copilot_engine.answer_query(req.query)
    return {
        "status": "SUCCESS",
        **response
    }
