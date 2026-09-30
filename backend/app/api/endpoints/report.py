from typing import Optional
from fastapi import APIRouter, Query
from fastapi.responses import HTMLResponse
from app.engines.report_engine import report_engine
from app.core.config import settings

router = APIRouter()


@router.get("/dossier")
async def get_intelligence_dossier(
    case_id: Optional[str] = Query("CR-2024-AUR-SPECIAL-01"),
    officer_name: Optional[str] = Query(settings.DEFAULT_IO_NAME),
    station_code: Optional[str] = Query(settings.OFFICER_STATION_CODE)
):
    """
    Generates a full forensic intelligence dossier in < 50ms, complete with
    suspect profiles, network centrality matrix, audio transcripts, and Section 63 BSA certificate.
    """
    return report_engine.generate_dossier(
        case_id=case_id,
        officer_name=officer_name,
        station_code=station_code
    )


@router.get("/printable", response_class=HTMLResponse)
async def get_printable_dossier(
    case_id: Optional[str] = Query("CR-2024-AUR-SPECIAL-01"),
    officer_name: Optional[str] = Query(settings.DEFAULT_IO_NAME),
    station_code: Optional[str] = Query(settings.OFFICER_STATION_CODE)
):
    """
    Returns an official, print-ready Section 63 BSA 2023 forensic dossier layout
    with official seals, suspect tables, and IO digital verification block.
    """
    dossier = report_engine.generate_dossier(case_id, officer_name, station_code)
    meta = dossier["metadata"]
    summary = dossier["executive_summary"]
    cert = dossier["bsa_section_63_certificate"]

    suspect_rows = "".join([
        f"<tr><td><b>{s['name']}</b></td><td>{s['role']}</td><td>{s['risk_score']}</td><td>{', '.join(s['phones'])}</td><td>{s['location']}</td></tr>"
        for s in dossier["suspect_profiles"]
    ])

    call_rows = "".join([
        f"<tr><td>{c['timestamp'][:19]}</td><td><b>{c['caller']}</b></td><td><b>{c['receiver']}</b></td><td>{c['duration_sec']}s</td><td>{c['tower_id']}</td><td>{c['notes']}</td></tr>"
        for c in dossier["intercepted_telecom_logs"]
    ])

    html_content = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Section 63 BSA Forensic Dossier - {meta['case_id']}</title>
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 30px; color: #1e293b; background: #fff; line-height: 1.5; }}
        .header {{ border-bottom: 3px double #0f172a; padding-bottom: 12px; margin-bottom: 20px; }}
        .title {{ font-size: 20px; font-weight: bold; text-transform: uppercase; color: #0f172a; letter-spacing: 0.5px; }}
        .subtitle {{ font-size: 11px; color: #475569; font-weight: 600; text-transform: uppercase; }}
        .badge {{ background: #dc2626; color: #fff; font-size: 10px; padding: 2px 8px; border-radius: 4px; font-weight: bold; float: right; }}
        .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 12px; }}
        .card {{ background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 12px; }}
        table {{ width: 100%; border-collapse: collapse; margin-top: 10px; margin-bottom: 20px; font-size: 11px; }}
        th, td {{ border: 1px solid #cbd5e1; padding: 6px 10px; text-align: left; }}
        th {{ background: #f1f5f9; color: #0f172a; font-weight: bold; }}
        .cert-box {{ background: #f0fdf4; border: 2px solid #16a34a; border-radius: 6px; padding: 15px; margin-top: 25px; }}
        .seal {{ font-family: monospace; font-size: 10px; color: #15803d; word-break: break-all; margin-top: 6px; }}
        @media print {{
            body {{ margin: 15mm; }}
            .no-print {{ display: none; }}
        }}
    </style>
</head>
<body>
    <div class="no-print" style="margin-bottom: 15px;">
        <button onclick="window.print()" style="background: #0284c7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">🖨️ Print / Save as PDF</button>
    </div>

    <div class="header">
        <span class="badge">CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE</span>
        <div class="subtitle">{meta['issuing_authority']}</div>
        <div class="title">CRIMINAL NETWORK INTELLIGENCE DOSSIER & EVIDENCE REPORT</div>
        <div style="font-size: 12px; color: #334155; margin-top: 4px;">Case Reference: <b>{meta['case_id']}</b> | Station: <b>{meta['station_code']}</b> | Generated in: <b>{meta['computation_time_ms']} ms</b></div>
    </div>

    <div class="grid">
        <div class="card">
            <b>INVESTIGATION SUMMARY</b><br>
            Analyzed Entities: <b>{summary['total_entities_analyzed']}</b><br>
            Mapped Relationships: <b>{summary['total_relationships_mapped']}</b><br>
            Primary Mastermind (PageRank): <b>{summary['primary_mastermind']}</b><br>
            Key Cross-Gang Broker (Betweenness): <b>{summary['primary_cross_gang_broker']}</b>
        </div>
        <div class="card">
            <b>LEGAL & COMPLIANCE DATA</b><br>
            Governing Statute: <b>{meta['governing_law']}</b><br>
            Investigating Officer: <b>{meta['investigating_officer']}</b><br>
            Cryptographic Integrity: <b style="color: #16a34a;">{summary['tamper_evident_integrity']}</b><br>
            Audit Merkle Blocks: <b>{cert['audit_blocks_count']} Blocks</b>
        </div>
    </div>

    <h3 style="font-size: 13px; text-transform: uppercase; margin-bottom: 4px;">1. Accused & Operative Profiles</h3>
    <table>
        <thead>
            <tr><th>Suspect Name</th><th>Syndicate Role</th><th>Threat Score</th><th>Monitored Handset(s)</th><th>Sector / Campus Location</th></tr>
        </thead>
        <tbody>
            {suspect_rows}
        </tbody>
    </table>

    <h3 style="font-size: 13px; text-transform: uppercase; margin-bottom: 4px;">2. Intercepted Call Detail Records & Surveillance Transcripts</h3>
    <table>
        <thead>
            <tr><th>Timestamp</th><th>Caller</th><th>Receiver</th><th>Duration</th><th>Cell Tower</th><th>Surveillance Intercept Notes</th></tr>
        </thead>
        <tbody>
            {call_rows}
        </tbody>
    </table>

    <div class="cert-box">
        <b style="color: #15803d; font-size: 13px;">CERTIFICATE UNDER SECTION 63 OF BHARATIYA SAKSHYA ADHINIYAM, 2023</b>
        <p style="font-size: 11px; margin: 8px 0 12px 0;">{cert['statutory_declaration']}</p>
        <div class="seal">
            <b>BLOCKCHAIN MERKLE ROOT HASH:</b> {cert['merkle_root_block_hash']}<br>
            <b>CRYPTOGRAPHIC HMAC-SHA256 SIGNATURE SEAL:</b> {cert['cryptographic_hmac_seal']}
        </div>
        <div style="margin-top: 15px; font-size: 11px;">
            <b>Digitally Certified by:</b> {meta['investigating_officer']} | <b>Authority:</b> NCRB Special Operations Division
        </div>
    </div>
</body>
</html>"""
    return html_content
