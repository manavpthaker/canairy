"""
Collectors rewritten against structured sources, each checked against the live
endpoint. On any failure they return None; they never substitute a number.
"""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple

import requests

from .base import BaseCollector

HEADERS = {"User-Agent": "Canairy/3.0 (household resilience monitor; https://canairy.news)"}


class FEMADeclarationsCollector(BaseCollector):
    """Distinct FEMA major-disaster (DR) and emergency (EM) declarations in the last 90 days.

    The summaries endpoint has one row per county, so rows are grouped by
    disasterNumber. Fire-management (FM) grants are excluded; they are routine
    wildfire cost-share approvals rather than disasters.
    """

    URL = "https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries"

    def collect(self) -> Optional[Dict[str, Any]]:
        since = (datetime.utcnow() - timedelta(days=90)).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "$filter": f"declarationDate ge '{since}'",
            "$select": "disasterNumber,declarationType,state",
            "$top": 10000,
        })
        resp.raise_for_status()
        rows = resp.json().get("DisasterDeclarationsSummaries", [])
        disasters: Dict[int, Dict[str, Any]] = {}
        for row in rows:
            disasters.setdefault(row["disasterNumber"], row)
        counted = [d for d in disasters.values() if d.get("declarationType") in ("DR", "EM")]
        return self._create_reading(len(counted), {
            "data_source": "FEMA OpenFEMA",
            "window_days": 90,
            "major_disasters": sum(1 for d in counted if d["declarationType"] == "DR"),
            "emergencies": sum(1 for d in counted if d["declarationType"] == "EM"),
            "states": sorted({d.get("state", "") for d in counted}),
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


class FDADrugShortagesCollector(BaseCollector):
    """Distinct drugs (by generic name) on FDA's current shortage list, via openFDA."""

    URL = 'https://api.fda.gov/drug/shortages.json?search=status:"Current"&count=generic_name.exact&limit=1000'

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        results = resp.json().get("results", [])
        if not results:
            return None
        return self._create_reading(len(results), {"data_source": "openFDA drug shortages"})

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


class FreightosFBXCollector(BaseCollector):
    """Freightos Baltic Index (global container rate, $ per 40ft container)."""

    URL = "https://www.freightos.com/enterprise/terminal/freightos-baltic-index-global-container-pricing-index/"
    TICKER = re.compile(r"frProductIntroTickerData\[[^\]]+\]\s*=\s*(\[.*?\]);", re.S)

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        resp.raise_for_status()
        match = self.TICKER.search(resp.text)
        if not match:
            return None
        for item in json.loads(match.group(1)):
            if item.get("label") == "FBX":
                value = float(item["value"].replace("$", "").replace(",", ""))
                return self._create_reading(value, {
                    "data_source": "Freightos FBX",
                    "weekly_change": item.get("change"),
                })
        return None

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class LuxuryDrawdownCollector(BaseCollector):
    """Average % below 1-year high for LVMH, Hermès and Kering share prices."""

    SYMBOLS = ("MC.PA", "RMS.PA", "KER.PA")

    def collect(self) -> Optional[Dict[str, Any]]:
        import yfinance as yf

        drawdowns = {}
        for symbol in self.SYMBOLS:
            closes = yf.Ticker(symbol).history(period="1y")["Close"].dropna()
            if len(closes) < 200:
                continue
            drawdowns[symbol] = (float(closes.iloc[-1]) / float(closes.max()) - 1) * 100
        if len(drawdowns) < 2:
            return None
        value = sum(drawdowns.values()) / len(drawdowns)
        return self._create_reading(round(value, 2), {
            "data_source": "Yahoo Finance",
            "by_symbol": {k: round(v, 2) for k, v in drawdowns.items()},
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class FREDSeriesCollector(BaseCollector):
    """One FRED series. Subclasses set SERIES and LABEL.

    MODE 'latest'   → most recent value
    MODE 'change'   → % change from the observation LAG periods back
                      (annualized by compounding when ANNUALIZE is set)
    """

    SERIES = ""
    LABEL = ""
    MODE = "latest"
    LAG = 1
    ANNUALIZE: Optional[int] = None  # periods per year
    URL = "https://api.stlouisfed.org/fred/series/observations"

    def _observations(self, limit: int) -> List[Dict[str, str]]:
        key = os.environ.get("FRED_API_KEY")
        if not key:
            return []
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "series_id": self.SERIES, "api_key": key, "file_type": "json",
            "sort_order": "desc", "limit": limit,
        })
        resp.raise_for_status()
        return [o for o in resp.json().get("observations", []) if o.get("value") not in (None, "", ".")]

    def _value_at(self, obs: List[Dict[str, str]], i: int) -> Optional[float]:
        latest = float(obs[i]["value"])
        if self.MODE == "latest":
            return latest
        if i + self.LAG >= len(obs):
            return None
        ratio = latest / float(obs[i + self.LAG]["value"])
        if self.ANNUALIZE:
            ratio = ratio ** (self.ANNUALIZE / self.LAG)
        return round((ratio - 1) * 100, 3)

    def collect(self) -> Optional[Dict[str, Any]]:
        obs = self._observations(20)
        if not obs:
            return None
        value = self._value_at(obs, 0)
        if value is None:
            return None
        meta = {"data_source": f"FRED {self.SERIES}", "observation_date": obs[0]["date"], "series": self.LABEL}
        if self.MODE == "change":
            meta["compared_to"] = obs[self.LAG]["date"]
        return self._create_reading(value, meta)

    def backfill(self, days: int) -> List[Tuple[datetime, float]]:
        """Past values as (observation date, value), oldest first."""
        cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        obs = self._observations(2000)
        points = []
        for i, o in enumerate(obs):
            if o["date"] < cutoff:
                break
            value = self._value_at(obs, i)
            if value is not None:
                points.append((datetime.strptime(o["date"], "%Y-%m-%d"), value))
        return list(reversed(points))

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class BrentCrudeCollector(FREDSeriesCollector):
    SERIES = "DCOILBRENTEU"
    LABEL = "Brent crude spot price, $/barrel (daily)"


class GasolinePriceCollector(FREDSeriesCollector):
    SERIES = "GASREGW"
    LABEL = "US regular gasoline retail price, $/gallon (weekly)"


class GroceryInflationCollector(FREDSeriesCollector):
    SERIES = "CUSR0000SAF11"
    LABEL = "CPI food at home, seasonally adjusted — 3-month change, annualized"
    MODE = "change"
    LAG = 3
    ANNUALIZE = 12


class JoblessClaimsCollector(FREDSeriesCollector):
    SERIES = "ICSA"
    LABEL = "Initial unemployment claims, weekly (seasonally adjusted)"


class GDPGrowthCollector(FREDSeriesCollector):
    SERIES = "A191RL1Q225SBEA"
    LABEL = "Real GDP growth, quarterly, annualized %"


class MortgageRateCollector(FREDSeriesCollector):
    SERIES = "MORTGAGE30US"
    LABEL = "Freddie Mac 30-year fixed mortgage rate, weekly"


class MortgageDelinquencyCollector(FREDSeriesCollector):
    SERIES = "DRSFRMACBS"
    LABEL = "Delinquency rate on single-family mortgages at commercial banks (30+ days), quarterly"


class DiscountWindowCollector(FREDSeriesCollector):
    SERIES = "WPC"
    LABEL = "Fed primary credit (discount window) outstanding, weekly average, $M"


class BankDepositsCollector(FREDSeriesCollector):
    SERIES = "DPSACBW027SBOG"
    LABEL = "Deposits at all commercial banks — week-over-week % change"
    MODE = "change"
    LAG = 1


class TreasuryAuctionDemandCollector(BaseCollector):
    """Bid-to-cover ratio at the most recent 10-year Treasury note auction.

    Lower means weaker demand for US debt. (A true auction "tail" needs the
    when-issued yield, which has no free source.)
    """

    URL = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v1/accounting/od/auctions_query"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "filter": "security_term:eq:10-Year,security_type:eq:Note,inflation_index_security:eq:No",
            "sort": "-auction_date",
            "page[size]": 10,
        })
        resp.raise_for_status()
        for row in resp.json().get("data", []):
            ratio = row.get("bid_to_cover_ratio")
            if ratio not in (None, "", "null"):
                return self._create_reading(float(ratio), {
                    "data_source": "Treasury Fiscal Data",
                    "auction_date": row.get("auction_date"),
                    "high_yield": row.get("high_yield"),
                })
        return None

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class FDICFailuresCollector(BaseCollector):
    """FDIC-insured bank failures in the trailing 12 months."""

    URL = "https://api.fdic.gov/banks/failures"

    def collect(self) -> Optional[Dict[str, Any]]:
        since = (datetime.utcnow() - timedelta(days=365)).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "filters": f"FAILDATE:[{since} TO *]",
            "fields": "NAME,FAILDATE,QBFASSET",
            "limit": 500,
        })
        resp.raise_for_status()
        body = resp.json()
        banks = [row["data"] for row in body.get("data", [])]
        return self._create_reading(int(body.get("totals", {}).get("count", len(banks))), {
            "data_source": "FDIC BankFind",
            "banks": [b.get("NAME") for b in banks],
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


class NatGasStorageCollector(BaseCollector):
    """Working gas in storage (lower 48), % above/below the 5-year average. EIA weekly report."""

    URL = "https://ir.eia.gov/ngs/wngsr.json"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        data = json.loads(resp.content.decode("utf-8-sig"))
        for series in data.get("series", []):
            if "lower 48" in series.get("name", "").lower():
                pct = series.get("calculated", {}).get("pct-chg_5yr-avg")
                if pct is None:
                    return None
                return self._create_reading(float(pct), {
                    "data_source": "EIA Weekly Natural Gas Storage Report",
                    "report_date": data.get("report_date"),
                })
        return None

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class SPRLevelCollector(BaseCollector):
    """Crude oil in the Strategic Petroleum Reserve, million barrels (EIA weekly).

    Needs EIA_API_KEY (free at https://www.eia.gov/opendata/register.php);
    the shared DEMO_KEY is rate-limited and usually fails.
    """

    URL = "https://api.eia.gov/v2/petroleum/stoc/wstk/data/"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "api_key": os.environ.get("EIA_API_KEY", "DEMO_KEY"),
            "frequency": "weekly",
            "data[0]": "value",
            "facets[series][]": "WCSSTUS1",
            "sort[0][column]": "period",
            "sort[0][direction]": "desc",
            "length": 1,
        })
        resp.raise_for_status()
        rows = resp.json().get("response", {}).get("data", [])
        if not rows:
            return None
        return self._create_reading(round(float(rows[0]["value"]) / 1000, 1), {
            "data_source": "EIA Weekly Petroleum Status",
            "period": rows[0].get("period"),
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class CISAKEVWeeklyCollector(BaseCollector):
    """Vulnerabilities CISA added to its Known Exploited list, per week (4-week average)."""

    URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        cutoff = datetime.utcnow().date() - timedelta(days=28)
        recent = [
            v for v in resp.json().get("vulnerabilities", [])
            if datetime.strptime(v["dateAdded"], "%Y-%m-%d").date() >= cutoff
        ]
        return self._create_reading(round(len(recent) / 4, 2), {
            "data_source": "CISA KEV catalog",
            "added_last_28_days": len(recent),
            "ransomware_linked": sum(1 for v in recent if v.get("knownRansomwareCampaignUse") == "Known"),
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class NWSExtremeAlertsCollector(BaseCollector):
    """Active National Weather Service alerts rated 'Extreme' over land."""

    URL = "https://api.weather.gov/alerts/active"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers={**HEADERS, "Accept": "application/geo+json"}, timeout=30, params={
            "status": "actual", "region_type": "land", "severity": "Extreme",
        })
        resp.raise_for_status()
        features = resp.json().get("features", [])
        events: Dict[str, int] = {}
        for f in features:
            event = f.get("properties", {}).get("event", "Unknown")
            events[event] = events.get(event, 0) + 1
        return self._create_reading(len(features), {"data_source": "NWS API", "events": events})

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


class TSAThroughputCollector(BaseCollector):
    """TSA checkpoint travelers per day, 7-day average, in thousands."""

    URL = "https://www.tsa.gov/travel/passenger-volumes"
    ROW = re.compile(r"<tr[^>]*>\s*<td[^>]*>\s*([0-9/]+)\s*</td>\s*<td[^>]*>\s*([0-9,]+)\s*</td>")

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=30)
        resp.raise_for_status()
        rows = self.ROW.findall(resp.text)[:7]
        if len(rows) < 7:
            return None
        avg = sum(int(count.replace(",", "")) for _, count in rows) / 7
        return self._create_reading(round(avg / 1000, 1), {
            "data_source": "TSA checkpoint numbers",
            "through": rows[0][0],
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class WHOOutbreakNewsCollector(BaseCollector):
    """WHO Disease Outbreak News posts in the last 60 days."""

    URL = "https://www.who.int/api/news/diseaseoutbreaknews"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30, params={
            "$orderby": "PublicationDateAndTime desc",
            "$top": 50,
            "$select": "Title,PublicationDateAndTime",
        })
        resp.raise_for_status()
        cutoff = (datetime.utcnow() - timedelta(days=60)).strftime("%Y-%m-%d")
        recent = [p for p in resp.json().get("value", []) if p.get("PublicationDateAndTime", "")[:10] >= cutoff]
        return self._create_reading(len(recent), {
            "data_source": "WHO Disease Outbreak News",
            "titles": [p["Title"] for p in recent[:10]],
        })

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)
