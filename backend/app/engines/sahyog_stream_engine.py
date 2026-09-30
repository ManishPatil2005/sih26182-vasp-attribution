"""
Live 1930 Cybercrime Helpline Feed & Stream Engine (SIH26182 V3)
Simulates real-time ingestion of live victim complaints from National Cybercrime Reporting Portal (NCRP / 1930)
with instant VASP attribution and statutory alert classification.
"""

import time
import random
from typing import Dict, List, Any, Generator
from datetime import datetime, timezone
from pydantic import BaseModel

from app.models.schemas import BlockchainNetwork
from app.engines.vasp_attribution_engine import vasp_engine
from app.engines.blockchain_intel_gateway import blockchain_gateway


class Live1930Alert(BaseModel):
    alert_id: str
    incident_time: str
    victim_city: str
    crime_category: str
    victim_reported_loss_inr: float
    unhosted_suspect_wallet: str
    detected_network: str
    attributed_vasp: str
    hop_count: int
    confidence_score: float
    statutory_action: str
    requires_immediate_freeze: bool


class SahyogStreamEngine:
    """
    Produces live streaming 1930 cyber fraud alerts and instant attributions.
    """

    CITIES = ["Mumbai", "Bengaluru", "New Delhi", "Hyderabad", "Pune", "Ahmedabad", "Jaipur", "Kolkata", "Chandigarh"]
    CRIMES = [
        ("Digital Arrest Video Extortion", 1500000.0, 7500000.0),
        ("Telegram VIP Stock Trading Scam", 800000.0, 4500000.0),
        ("Part-Time Review / Task Fraud", 250000.0, 1800000.0),
        ("Crypto Arbitrage Ponzi Platform", 1200000.0, 6000000.0),
        ("Ransomware Encrypted Server Demand", 3500000.0, 9500000.0)
    ]

    UNHOSTED_SAMPLES = [
        ("TTsY1v6BpxvU9jP1k2L4wE8rT992p", BlockchainNetwork.TRON),
        ("0x71C83e20B13b0F2843A166f2C8f152d80d2d3489", BlockchainNetwork.ETHEREUM),
        ("bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq", BlockchainNetwork.BITCOIN),
        ("TKa891x24NqZ91vM88aL9KzP4rT8812", BlockchainNetwork.TRON),
        ("0x3892F1c0A92b84C28190B1948291048201948201", BlockchainNetwork.ETHEREUM),
        ("Sol982x1PqMz981La92048102948190284719284710", BlockchainNetwork.SOLANA)
    ]

    def generate_live_alert(self) -> Live1930Alert:
        """
        Synthesizes a realistic live 1930 victim complaint and attributes on-the-fly.
        """
        alert_idx = random.randint(10000, 99999)
        alert_id = f"1930-ALERT-{alert_idx}"
        city = random.choice(self.CITIES)
        crime, min_loss, max_loss = random.choice(self.CRIMES)
        loss_inr = round(random.uniform(min_loss, max_loss), -3)

        # Generate or pick an unhosted suspect wallet
        if random.random() < 0.6:
            wallet, net = random.choice(self.UNHOSTED_SAMPLES)
        else:
            rand_hex = hashlib_hex = f"{random.randint(100000, 999999)}"
            wallet = f"TR7NHq{rand_hex}MueP24vX8912"
            net = BlockchainNetwork.TRON

        # Attribute via VASP engine
        attr = vasp_engine.attribute_wallet(
            wallet_address=wallet,
            network=net,
            officer_id="NCRP-1930-ROUTER"
        )

        deep_scan = blockchain_gateway.analyze_typology_and_taint(wallet, net)

        now_utc = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

        return Live1930Alert(
            alert_id=alert_id,
            incident_time=now_utc,
            victim_city=city,
            crime_category=crime,
            victim_reported_loss_inr=loss_inr,
            unhosted_suspect_wallet=wallet,
            detected_network=net.value,
            attributed_vasp=attr.nearest_vasp.name,
            hop_count=attr.hop_distance,
            confidence_score=attr.attribution_confidence_percent,
            statutory_action=deep_scan.statutory_urgency,
            requires_immediate_freeze=(attr.estimated_amount_inr >= 1000000.0 or deep_scan.composite_risk_score >= 70.0)
        )

    def get_recent_live_feed(self, count: int = 6) -> List[Live1930Alert]:
        """Returns batch of recent simulated 1930 alerts."""
        alerts = []
        for _ in range(count):
            alerts.append(self.generate_live_alert())
        return alerts


sahyog_stream_engine = SahyogStreamEngine()
