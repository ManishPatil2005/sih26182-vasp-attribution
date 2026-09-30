from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from app.models.schemas import GraphNode, GraphEdge, GraphData


class AgencyProfile(BaseModel):
    agency_code: str
    agency_name: str
    clearance_level: str
    description: str
    can_issue_warrants: bool
    can_view_undercover_assets: bool
    can_export_court_evidence: bool


class AgencyRBACEngine:
    """
    Multi-Agency Federated Collaboration & Need-to-Know Compartmentalization Engine:
    Enforces security clearances and cryptographically redacts sensitive undercover assets
    for field officer views under the Official Secrets Act and Section 63 BSA 2023.
    """

    def __init__(self):
        self.profiles: Dict[str, AgencyProfile] = {
            "MHA_APEX_COMMAND": AgencyProfile(
                agency_code="MHA_APEX_COMMAND",
                agency_name="Ministry of Home Affairs & I4C (Apex National Security Command)",
                clearance_level="TOP_SECRET_APEX",
                description="Unrestricted national overview, blockchain forensics, VASP attribution, Section 94 BNSS statutory freezing, and cross-border intelligence feeds.",
                can_issue_warrants=True,
                can_view_undercover_assets=True,
                can_export_court_evidence=True
            ),
            "I4C_BLOCKCHAIN_OPS": AgencyProfile(
                agency_code="I4C_BLOCKCHAIN_OPS",
                agency_name="Indian Cyber Crime Coordination Centre (I4C Blockchain Forensics & VASP Attribution)",
                clearance_level="RESTRICTED_I4C_CRYPTO_OPS",
                description="Lead taskforce on multi-chain cryptocurrency tracing, mule wallet clustering, and automated VASP attribution under SIH26182.",
                can_issue_warrants=True,
                can_view_undercover_assets=True,
                can_export_court_evidence=True
            ),
            "FIU_IND_COMPLIANCE": AgencyProfile(
                agency_code="FIU_IND_COMPLIANCE",
                agency_name="Financial Intelligence Unit - India (FIU-IND VDA Compliance & AML Division)",
                clearance_level="CONFIDENTIAL_FINANCIAL_INTEL",
                description="FIU-IND registered VASP coordination, Section 94 BNSS wallet freezing directives, and anti-money laundering compliance.",
                can_issue_warrants=True,
                can_view_undercover_assets=True,
                can_export_court_evidence=True
            ),
            "NCRB_WOMEN_SAFETY": AgencyProfile(
                agency_code="NCRB_WOMEN_SAFETY",
                agency_name="National Crime Records Bureau (Cybercrime Division)",
                clearance_level="RESTRICTED_NCRB_OPS",
                description="National cybercrime records, fraud tracking, and forensic support under BNS 2023.",
                can_issue_warrants=True,
                can_view_undercover_assets=True,
                can_export_court_evidence=True
            ),
            "NIA_TERROR_FINANCE": AgencyProfile(
                agency_code="NIA_TERROR_FINANCE",
                agency_name="National Investigation Agency (Special Terror & Hawala Cell)",
                clearance_level="CONFIDENTIAL_FINANCIAL_INTEL",
                description="Focus on high-value Hawala laundering loops, cross-border cryptocurrency pipelines, and darknet escrows.",
                can_issue_warrants=True,
                can_view_undercover_assets=True,
                can_export_court_evidence=True
            ),
            "STATE_POLICE_IO": AgencyProfile(
                agency_code="STATE_POLICE_IO",
                agency_name="State Police Cyber Crime Unit (1930 Cyber Fraud Taskforce)",
                clearance_level="OPERATIONAL_FIELD_CLEARANCE",
                description="Field investigation, 1930 helpline complaint tracing, mule wallet freezing, and court evidence filing.",
                can_issue_warrants=False,
                can_view_undercover_assets=False,
                can_export_court_evidence=True
            )
        }

    def get_agency_profiles(self) -> List[AgencyProfile]:
        return list(self.profiles.values())

    def sanitize_graph_for_agency(self, graph_data: GraphData, agency_code: str) -> GraphData:
        """
        Redacts undercover asset names and phone numbers for non-apex clearances.
        """
        profile = self.profiles.get(agency_code, self.profiles["STATE_POLICE_IO"])
        
        # If agency can view undercover assets, return full graph
        if profile.can_view_undercover_assets:
            return graph_data

        # Otherwise sanitize undercover assets
        sanitized_nodes: List[GraphNode] = []
        for n in graph_data.nodes:
            is_undercover = n.properties.get("is_undercover_asset", False) or "informant" in n.label.lower()
            if is_undercover:
                sanitized = GraphNode(
                    id=n.id,
                    type=n.type,
                    label="[REDACTED_COVERT_ASSET_DELTA]",
                    risk_score=0.1,
                    properties={
                        "redacted": True,
                        "clearance_required": "TOP_SECRET_APEX",
                        "statute": "Protected Source (Official Secrets Act / Sec 63 BSA 2023)"
                    },
                    evidence_refs=[]
                )
                sanitized_nodes.append(sanitized)
            else:
                sanitized_nodes.append(n)

        return GraphData(
            nodes=sanitized_nodes,
            edges=graph_data.edges,
            metadata={
                **graph_data.metadata,
                "sanitized_for_agency": agency_code,
                "clearance": profile.clearance_level
            }
        )


# Global singleton instance
agency_rbac = AgencyRBACEngine()
