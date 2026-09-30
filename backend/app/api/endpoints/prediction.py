from fastapi import APIRouter, Query
from typing import Dict, Any, List
from app.engines.link_prediction import link_prediction_engine

router = APIRouter()


@router.post("/predict-links")
def predict_hidden_links(top_k: int = Query(default=10, ge=1, le=50)) -> Dict[str, Any]:
    """
    Predicts hidden, covert edges between suspects who avoid direct communications
    using Adamic-Adar, Jaccard Coefficient, and Resource Allocation graph heuristics.
    """
    predictions = link_prediction_engine.predict_hidden_links(top_k=top_k)
    return {
        "status": "SUCCESS",
        "predicted_links_count": len(predictions),
        "predictions": predictions,
    }
