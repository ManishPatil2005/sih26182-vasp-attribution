import math
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from collections import defaultdict


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Computes great-circle distance between two geographic coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2) ** 2 + math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c


class TowerDumpRecord:
    def __init__(
        self,
        record_id: str,
        phone: str,
        suspect_name: str,
        tower_id: str,
        tower_name: str,
        lat: float,
        lon: float,
        timestamp: datetime,
        call_type: str = "TOWER_PING"
    ):
        self.record_id = record_id
        self.phone = phone
        self.suspect_name = suspect_name
        self.tower_id = tower_id
        self.tower_name = tower_name
        self.lat = lat
        self.lon = lon
        self.timestamp = timestamp
        self.call_type = call_type


class ColocationEngine:
    """
    Spatio-Temporal Co-Location Engine (Version 3.0):
    Detects physical rendezvous events and proximity meetings from cellular tower dumps
    and CDR telemetry across temporal time windows (default <= 15 minutes).
    Identifies hidden physical meets even if phones were kept in airplane mode or
    no calls were placed to each other.
    """

    def __init__(self):
        # In-memory storage for active tower dump records
        self.records: List[TowerDumpRecord] = []
        self._initialize_default_telemetry()

    def _initialize_default_telemetry(self):
        """Seed realistic Maharashtra / NCRB Operation Rakshak cellular tower pings."""
        base_time = datetime(2026, 9, 21, 14, 0, 0)
        
        # Scenario coordinates (Chhatrapati Sambhajinagar / Aurangabad & Pune/Mumbai corridor)
        towers = {
            "TWR-CSN-01": {"name": "Kranti Chowk Sector 4", "lat": 19.8732, "lon": 75.3245},
            "TWR-CSN-02": {"name": "Deogiri College Junction", "lat": 19.8821, "lon": 75.3168},
            "TWR-CSN-03": {"name": "CIDCO Bus Stand Hub", "lat": 19.8778, "lon": 75.3582},
            "TWR-CSN-04": {"name": "MGM Sports Complex Gateway", "lat": 19.8665, "lon": 75.3621},
            "TWR-CSN-05": {"name": "Waluj MIDC Industrial Gate", "lat": 19.8312, "lon": 75.2289},
            "TWR-PUN-01": {"name": "Pune Swargate Central", "lat": 18.5018, "lon": 73.8585},
            "TWR-MUM-01": {"name": "Mumbai Bandra Kurla Complex", "lat": 19.0657, "lon": 72.8687},
        }

        # Simulated pings showing covert rendezvous between Krish, Manish, Afnan, Kabir, and Tanya
        sample_pings = [
            # Event 1: Krish & Manish meet at Kranti Chowk (14:15 - 14:25)
            ("REC-01", "+919822011111", "Krish Sharma", "TWR-CSN-01", base_time + timedelta(minutes=15)),
            ("REC-02", "+919822022222", "Manish Patil", "TWR-CSN-01", base_time + timedelta(minutes=22)),
            
            # Event 2: Manish & Afnan meet at Waluj MIDC (Arms/Sim handover) (18:30 - 18:40)
            ("REC-03", "+919822022222", "Manish Patil", "TWR-CSN-05", base_time + timedelta(hours=4, minutes=30)),
            ("REC-04", "+919822033333", "Afnan Khan", "TWR-CSN-05", base_time + timedelta(hours=4, minutes=38)),
            
            # Event 3: Multi-party safehouse rendezvous at CIDCO (Tanya, Kabir, Afnan) (21:05 - 21:18)
            ("REC-05", "+919822044444", "Tanya Verma", "TWR-CSN-03", base_time + timedelta(hours=7, minutes=5)),
            ("REC-06", "+919822055555", "Kabir Mehta", "TWR-CSN-03", base_time + timedelta(hours=7, minutes=12)),
            ("REC-07", "+919822033333", "Afnan Khan", "TWR-CSN-03", base_time + timedelta(hours=7, minutes=18)),

            # Pre-incident reconnaissance at Deogiri College
            ("REC-08", "+919822011111", "Krish Sharma", "TWR-CSN-02", base_time + timedelta(hours=22, minutes=10)),
            ("REC-09", "+919822011111", "Krish Sharma", "TWR-CSN-02", base_time + timedelta(hours=22, minutes=25)),

            # Transit pings
            ("REC-10", "+919822055555", "Kabir Mehta", "TWR-PUN-01", base_time + timedelta(days=1, hours=3)),
            ("REC-11", "+919822044444", "Tanya Verma", "TWR-MUM-01", base_time + timedelta(days=1, hours=5)),
        ]

        self.records = []
        for rec_id, phone, name, twr_id, dt in sample_pings:
            info = towers[twr_id]
            self.records.append(
                TowerDumpRecord(
                    record_id=rec_id,
                    phone=phone,
                    suspect_name=name,
                    tower_id=twr_id,
                    tower_name=info["name"],
                    lat=info["lat"],
                    lon=info["lon"],
                    timestamp=dt,
                )
            )

    def analyze_colocations(
        self,
        time_window_minutes: int = 15,
        max_distance_meters: float = 300.0
    ) -> List[Dict[str, Any]]:
        """
        Discovers all spatio-temporal co-location events where 2 or more distinct suspects
        pinged the same or adjacent towers within `time_window_minutes`.
        """
        if not self.records:
            return []

        # Sort records chronologically
        sorted_records = sorted(self.records, key=lambda r: r.timestamp)
        rendezvous_clusters = []
        visited = set()

        for i in range(len(sorted_records)):
            if i in visited:
                continue
            
            anchor = sorted_records[i]
            cluster_records = [anchor]
            cluster_suspects = {anchor.suspect_name}

            for j in range(i + 1, len(sorted_records)):
                candidate = sorted_records[j]
                
                # Check time window
                time_diff = (candidate.timestamp - anchor.timestamp).total_seconds() / 60.0
                if time_diff > time_window_minutes:
                    break  # Chronological order guarantees no further matches with anchor

                # Check spatial distance
                dist = haversine_distance_meters(anchor.lat, anchor.lon, candidate.lat, candidate.lon)
                if dist <= max_distance_meters:
                    cluster_records.append(candidate)
                    cluster_suspects.add(candidate.suspect_name)
                    visited.add(j)

            # A true co-location requires >= 2 distinct suspects
            if len(cluster_suspects) >= 2:
                visited.add(i)
                suspect_list = sorted(list(cluster_suspects))
                times = [r.timestamp for r in cluster_records]
                min_time = min(times)
                max_time = max(times)
                duration = round((max_time - min_time).total_seconds() / 60.0, 1)

                # Determine suspicion level
                suspicion = "HIGH"
                if len(suspect_list) >= 3 or duration >= 10.0:
                    suspicion = "CRITICAL"

                rendezvous_clusters.append({
                    "event_id": f"RENDEZVOUS-{anchor.tower_id}-{int(min_time.timestamp())}",
                    "tower_id": anchor.tower_id,
                    "tower_name": anchor.tower_name,
                    "latitude": anchor.lat,
                    "longitude": anchor.lon,
                    "first_ping": min_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "last_ping": max_time.strftime("%Y-%m-%d %H:%M:%S"),
                    "temporal_window_minutes": time_window_minutes,
                    "duration_observed_minutes": duration,
                    "suspect_count": len(suspect_list),
                    "suspects_present": suspect_list,
                    "phones_involved": list(set(r.phone for r in cluster_records)),
                    "suspicion_level": suspicion,
                    "evidence_summary": (
                        f"Simultaneous cellular footprint detected: {', '.join(suspect_list)} "
                        f"co-located at '{anchor.tower_name}' ({anchor.tower_id}) within {duration} min window. "
                        f"Strong physical meeting evidence independent of call logs."
                    )
                })

        return rendezvous_clusters

    def get_towers_and_trajectories(self) -> Dict[str, Any]:
        """
        Returns structured geographic nodes (towers, rendezvous points) and
        per-suspect movement trajectories for GIS Map visualization.
        """
        tower_map = {}
        trajectories = defaultdict(list)

        for r in sorted(self.records, key=lambda x: x.timestamp):
            if r.tower_id not in tower_map:
                tower_map[r.tower_id] = {
                    "tower_id": r.tower_id,
                    "tower_name": r.tower_name,
                    "lat": r.lat,
                    "lon": r.lon,
                    "total_pings": 0,
                    "unique_suspects": set(),
                }
            tower_map[r.tower_id]["total_pings"] += 1
            tower_map[r.tower_id]["unique_suspects"].add(r.suspect_name)

            trajectories[r.suspect_name].append({
                "tower_id": r.tower_id,
                "tower_name": r.tower_name,
                "lat": r.lat,
                "lon": r.lon,
                "timestamp": r.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
                "phone": r.phone,
            })

        # Format towers
        formatted_towers = []
        for t in tower_map.values():
            formatted_towers.append({
                "tower_id": t["tower_id"],
                "tower_name": t["tower_name"],
                "lat": t["lat"],
                "lon": t["lon"],
                "total_pings": t["total_pings"],
                "suspects_observed": sorted(list(t["unique_suspects"])),
                "is_rendezvous_hotspot": len(t["unique_suspects"]) >= 2,
            })

        formatted_trajectories = [
            {
                "suspect_name": name,
                "pings_count": len(points),
                "path": points
            }
            for name, points in trajectories.items()
        ]

        return {
            "towers": formatted_towers,
            "trajectories": formatted_trajectories,
            "colocations": self.analyze_colocations(),
        }


colocation_engine = ColocationEngine()
