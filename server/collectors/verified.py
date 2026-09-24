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

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        return _fema_history(years)

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


def _rolling_counts(events: List[datetime], window_days: int, years: int, step_days: int = 7) -> List[Tuple[datetime, float]]:
    """Count of events in the trailing window, sampled every `step_days` over the last `years`."""
    events = sorted(events)
    out: List[Tuple[datetime, float]] = []
    end = datetime.utcnow()
    t = end - timedelta(days=365 * years)
    lo = hi = 0
    while t <= end:
        while hi < len(events) and events[hi] <= t:
            hi += 1
        while lo < hi and events[lo] <= t - timedelta(days=window_days):
            lo += 1
        out.append((t, float(hi - lo)))
        t += timedelta(days=step_days)
    return out


def _fema_history(years: int) -> List[Tuple[datetime, float]]:
    since = (datetime.utcnow() - timedelta(days=365 * years + 90)).strftime("%Y-%m-%d")
    rows: List[Dict[str, Any]] = []
    skip = 0
    while True:
        resp = requests.get(FEMADeclarationsCollector.URL, headers=HEADERS, timeout=60, params={
            "$filter": f"declarationDate ge '{since}' and (declarationType eq 'DR' or declarationType eq 'EM')",
            "$select": "disasterNumber,declarationDate",
            "$top": 10000, "$skip": skip,
        })
        resp.raise_for_status()
        page = resp.json().get("DisasterDeclarationsSummaries", [])
        rows += page
        if len(page) < 10000:
            break
        skip += 10000
    first: Dict[int, datetime] = {}
    for r in rows:
        d = datetime.strptime(r["declarationDate"][:10], "%Y-%m-%d")
        first[r["disasterNumber"]] = min(d, first.get(r["disasterNumber"], d))
    return _rolling_counts(list(first.values()), 90, years)


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


def _yahoo_chart(symbol: str, range_: str, interval: str) -> Dict[str, Any]:
    resp = requests.get(
        f"https://query1.finance.yahoo.com/v8/finance/chart/{symbol}",
        params={"range": range_, "interval": interval},
        headers={"User-Agent": "Mozilla/5.0"}, timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["chart"]["result"][0]


class TreasuryVolatilityCollector(BaseCollector):
    """Today's high-low range of the 10-year Treasury yield (^TNX), in basis points."""

    def collect(self) -> Optional[Dict[str, Any]]:
        meta = _yahoo_chart("^TNX", "1d", "5m")["meta"]
        high, low = meta.get("regularMarketDayHigh"), meta.get("regularMarketDayLow")
        if high is None or low is None:
            return None
        return self._create_reading(round((high - low) * 100, 2), {
            "data_source": "Yahoo Finance ^TNX",
            "yield_high": high, "yield_low": low,
            "market_time": datetime.utcfromtimestamp(meta.get("regularMarketTime", 0)).isoformat(),
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        return _tnx_history(years)

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


def _tnx_history(years: int) -> List[Tuple[datetime, float]]:
    chart = _yahoo_chart("^TNX", f"{years}y", "1d")
    q = chart["indicators"]["quote"][0]
    out = []
    for ts, hi, lo in zip(chart["timestamp"], q["high"], q["low"]):
        if hi is not None and lo is not None and hi >= lo:
            out.append((datetime.utcfromtimestamp(ts), round((hi - lo) * 100, 2)))
    return out


class LuxuryDrawdownCollector(BaseCollector):
    """Average % below 1-year high for LVMH, Hermès and Kering share prices."""

    SYMBOLS = ("MC.PA", "RMS.PA", "KER.PA")

    def collect(self) -> Optional[Dict[str, Any]]:
        drawdowns = {}
        for symbol in self.SYMBOLS:
            quote = _yahoo_chart(symbol, "1y", "1d")["indicators"]["quote"][0]
            closes = [c for c in quote.get("close", []) if c is not None]
            if len(closes) < 200:
                continue
            drawdowns[symbol] = (closes[-1] / max(closes) - 1) * 100
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
    LAG = 1  # observations back (weekly series)
    LAG_MONTHS = 0  # calendar months back (monthly series); takes precedence over LAG
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

    def _prior_index(self, obs: List[Dict[str, str]], i: int) -> Optional[int]:
        """Index of the observation to compare obs[i] against.

        LAG_MONTHS matches by calendar date, so a missing month (e.g. October
        2025, lost to the government shutdown) gives no value instead of a
        comparison against the wrong month.
        """
        if self.LAG_MONTHS:
            y, m, d = (int(x) for x in obs[i]["date"].split("-"))
            m -= self.LAG_MONTHS
            while m <= 0:
                m += 12
                y -= 1
            target = f"{y:04d}-{m:02d}-{d:02d}"
            return next((j for j in range(i + 1, len(obs)) if obs[j]["date"] == target), None)
        return i + self.LAG if i + self.LAG < len(obs) else None

    def _value_at(self, obs: List[Dict[str, str]], i: int) -> Optional[float]:
        latest = float(obs[i]["value"])
        if self.MODE == "latest":
            return latest
        j = self._prior_index(obs, i)
        if j is None:
            return None
        ratio = latest / float(obs[j]["value"])
        if self.ANNUALIZE:
            periods = self.LAG_MONTHS or self.LAG
            ratio = ratio ** (self.ANNUALIZE / periods)
        return round((ratio - 1) * 100, 3)

    def collect(self) -> Optional[Dict[str, Any]]:
        obs = self._observations(30)
        if not obs:
            return None
        value = self._value_at(obs, 0)
        if value is None:
            return None
        meta = {"data_source": f"FRED {self.SERIES}", "observation_date": obs[0]["date"], "series": self.LABEL}
        if self.MODE == "change":
            meta["compared_to"] = obs[self._prior_index(obs, 0)]["date"]
        return self._create_reading(value, meta)

    def backfill(self, days: int) -> List[Tuple[datetime, float]]:
        """Past values as (observation date, value), oldest first."""
        cutoff = (datetime.utcnow() - timedelta(days=days)).strftime("%Y-%m-%d")
        obs = self._observations(20000 if days > 400 else 2000)
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


    def history(self, years: int) -> List[Tuple[datetime, float]]:
        return self.backfill(365 * years + 400)


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
    LAG_MONTHS = 3
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

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        since = (datetime.utcnow() - timedelta(days=365 * years)).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=60, params={
            "filter": f"security_term:eq:10-Year,security_type:eq:Note,inflation_index_security:eq:No,auction_date:gte:{since}",
            "sort": "auction_date", "page[size]": 1000,
        })
        resp.raise_for_status()
        return [
            (datetime.strptime(r["auction_date"], "%Y-%m-%d"), float(r["bid_to_cover_ratio"]))
            for r in resp.json().get("data", [])
            if r.get("bid_to_cover_ratio") not in (None, "", "null")
        ]

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

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        since = (datetime.utcnow() - timedelta(days=365 * (years + 1))).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=60, params={
            "filters": f"FAILDATE:[{since} TO *]", "fields": "FAILDATE", "limit": 10000,
        })
        resp.raise_for_status()
        dates = [datetime.strptime(r["data"]["FAILDATE"], "%m/%d/%Y") for r in resp.json().get("data", [])]
        return _rolling_counts(dates, 365, years, step_days=30)

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

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=60, params={
            "api_key": os.environ.get("EIA_API_KEY", "DEMO_KEY"), "frequency": "weekly",
            "data[0]": "value", "facets[series][]": "WCSSTUS1",
            "sort[0][column]": "period", "sort[0][direction]": "desc", "length": 53 * years,
        })
        resp.raise_for_status()
        return sorted(
            (datetime.strptime(r["period"], "%Y-%m-%d"), round(float(r["value"]) / 1000, 1))
            for r in resp.json().get("response", {}).get("data", [])
        )

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

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        dates = [datetime.strptime(v["dateAdded"], "%Y-%m-%d") for v in resp.json().get("vulnerabilities", [])]
        # The catalog's first weeks (Nov 2021) loaded its backlog in bulk; start after that.
        start = datetime(2022, 6, 1)
        return [(t, n / 4) for t, n in _rolling_counts(dates, 28, years) if t >= start]

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


# ─── Added indicators (verified 2026-09-24) ───

class ContinuingClaimsCollector(FREDSeriesCollector):
    SERIES = "CCSA"
    LABEL = "Continued unemployment claims, weekly (seasonally adjusted)"


class RentInflationCollector(FREDSeriesCollector):
    SERIES = "CUSR0000SEHA"
    LABEL = "CPI rent of primary residence — change from a year earlier"
    MODE = "change"
    LAG_MONTHS = 12


class ElectricityInflationCollector(FREDSeriesCollector):
    SERIES = "CUSR0000SEHF01"
    LABEL = "CPI electricity — change from a year earlier"
    MODE = "change"
    LAG_MONTHS = 12


class SahmRuleCollector(FREDSeriesCollector):
    SERIES = "SAHMREALTIME"
    LABEL = "Sahm rule recession indicator (real-time), percentage points"


class CardDelinquencyCollector(FREDSeriesCollector):
    SERIES = "DRCCLACBS"
    LABEL = "Delinquency rate on credit card loans at commercial banks, quarterly"


class SavingRateCollector(FREDSeriesCollector):
    SERIES = "PSAVERT"
    LABEL = "Personal saving rate, monthly"


class BeefPriceCollector(FREDSeriesCollector):
    SERIES = "APU0000703112"
    LABEL = "Average price of ground beef (100% beef), per lb — change from a year earlier"
    MODE = "change"
    LAG_MONTHS = 12


class RealWagesCollector(BaseCollector):
    """Hourly pay for production/non-supervisory workers vs consumer prices, % change from a year earlier."""

    def collect(self) -> Optional[Dict[str, Any]]:
        wages = _FREDSeries("AHETPI")
        prices = _FREDSeries("CPIAUCSL")
        w_obs, p_obs = wages._observations(30), prices._observations(30)
        if not w_obs or not p_obs:
            return None
        date = w_obs[0]["date"]
        p_i = next((i for i, o in enumerate(p_obs) if o["date"] == date), None)
        if p_i is None:
            return None
        w_change, p_change = wages._value_at(w_obs, 0), prices._value_at(p_obs, p_i)
        if w_change is None or p_change is None:
            return None
        real = ((1 + w_change / 100) / (1 + p_change / 100) - 1) * 100
        return self._create_reading(round(real, 2), {
            "data_source": "FRED AHETPI / CPIAUCSL",
            "observation_date": date,
            "wage_change": w_change, "price_change": p_change,
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        wages = dict(_FREDSeries("AHETPI").history(years))
        prices = dict(_FREDSeries("CPIAUCSL").history(years))
        return [
            (d, round(((1 + wages[d] / 100) / (1 + prices[d] / 100) - 1) * 100, 2))
            for d in sorted(wages) if d in prices
        ]

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class _FREDSeries(FREDSeriesCollector):
    """Year-over-year helper for an arbitrary monthly FRED series."""

    MODE = "change"
    LAG_MONTHS = 12

    def __init__(self, series: str):
        super().__init__({})
        self.SERIES = series


class BLSInflationCollector(BaseCollector):
    """Year-over-year change for a BLS CPI series not carried by FRED. Subclasses set SERIES.

    The keyless BLS API allows 25 requests a day, so the catalog limits this to a few runs a day.
    """

    SERIES = ""
    URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

    def collect(self) -> Optional[Dict[str, Any]]:
        key = os.environ.get("BLS_API_KEY")
        url = self.URL + self.SERIES + (f"?registrationkey={key}" if key else "")
        resp = requests.get(url, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        body = resp.json()
        if body.get("status") != "REQUEST_SUCCEEDED":
            return None
        rows = [r for r in body["Results"]["series"][0]["data"] if r["period"].startswith("M") and r["value"] not in ("-", "")]
        if not rows:
            return None
        latest = rows[0]
        prior = next((r for r in rows if r["period"] == latest["period"] and int(r["year"]) == int(latest["year"]) - 1), None)
        if prior is None:
            return None
        change = (float(latest["value"]) / float(prior["value"]) - 1) * 100
        return self._create_reading(round(change, 2), {
            "data_source": f"BLS {self.SERIES}",
            "observation_date": f"{latest['year']}-{latest['period'][1:]}",
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        now = datetime.utcnow().year
        payload: Dict[str, Any] = {"seriesid": [self.SERIES], "startyear": str(now - years - 1), "endyear": str(now)}
        if os.environ.get("BLS_API_KEY"):
            payload["registrationkey"] = os.environ["BLS_API_KEY"]
        resp = requests.post("https://api.bls.gov/publicAPI/v2/timeseries/data/", json=payload, headers=HEADERS, timeout=60)
        resp.raise_for_status()
        body = resp.json()
        if body.get("status") != "REQUEST_SUCCEEDED":
            return []
        values = {
            (int(r["year"]), r["period"]): float(r["value"])
            for r in body["Results"]["series"][0]["data"]
            if r["period"].startswith("M") and r["period"] != "M13" and r["value"] not in ("-", "")
        }
        out = []
        for (y, per), v in sorted(values.items()):
            prior = values.get((y - 1, per))
            if prior:
                out.append((datetime(y, int(per[1:]), 1), round((v / prior - 1) * 100, 2)))
        return out

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class AutoInsuranceInflationCollector(BLSInflationCollector):
    SERIES = "CUSR0000SETE"


class ChildcareInflationCollector(BLSInflationCollector):
    SERIES = "CUUR0000SEEB03"


class WastewaterCollector(BaseCollector):
    """Share of the monitored population in sewersheds rated High or Very High, worst of COVID / flu A / RSV (CDC NWSS)."""

    URL = "https://data.cdc.gov/resource/atcp-73re.json"
    PATHOGENS = {"SARS-CoV-2": "COVID", "Influenza A virus": "Flu A", "RSV": "RSV"}

    def collect(self) -> Optional[Dict[str, Any]]:
        since = (datetime.utcnow() - timedelta(days=21)).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=60, params={
            "$select": "week_end,pathogen_target,site_wval_category,sum(population_served) as pop",
            "$group": "week_end,pathogen_target,site_wval_category",
            "$where": f"week_end >= '{since}'",
            "$limit": 500,
        })
        resp.raise_for_status()
        rows = resp.json()
        if not rows:
            return None
        latest_week = max(r["week_end"][:10] for r in rows)
        shares = {}
        for pathogen, label in self.PATHOGENS.items():
            week = [r for r in rows if r["week_end"][:10] == latest_week and r["pathogen_target"] == pathogen]
            total = sum(float(r.get("pop") or 0) for r in week)
            high = sum(float(r.get("pop") or 0) for r in week if r.get("site_wval_category") in ("High", "Very High"))
            if total:
                shares[label] = round(100 * high / total, 1)
        if not shares:
            return None
        worst = max(shares, key=shares.get)
        return self._create_reading(shares[worst], {
            "data_source": "CDC National Wastewater Surveillance",
            "week_end": latest_week, "by_pathogen": shares, "worst": worst,
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        since = (datetime.utcnow() - timedelta(days=365 * years)).strftime("%Y-%m-%d")
        resp = requests.get(self.URL, headers=HEADERS, timeout=120, params={
            "$select": "week_end,pathogen_target,site_wval_category,sum(population_served) as pop",
            "$group": "week_end,pathogen_target,site_wval_category",
            "$where": f"week_end >= '{since}'",
            "$limit": 50000,
        })
        resp.raise_for_status()
        totals: Dict[Tuple[str, str], float] = {}
        high: Dict[Tuple[str, str], float] = {}
        for r in resp.json():
            key = (r["week_end"][:10], r["pathogen_target"])
            pop = float(r.get("pop") or 0)
            totals[key] = totals.get(key, 0) + pop
            if r.get("site_wval_category") in ("High", "Very High"):
                high[key] = high.get(key, 0) + pop
        worst: Dict[str, float] = {}
        for (week, pathogen), total in totals.items():
            if pathogen in self.PATHOGENS and total:
                worst[week] = max(worst.get(week, 0), 100 * high.get((week, pathogen), 0) / total)
        return [(datetime.strptime(w, "%Y-%m-%d"), round(v, 1)) for w, v in sorted(worst.items())]

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)


class MeaslesCollector(BaseCollector):
    """US measles cases reported in the last 4 complete weeks (CDC weekly case counts)."""

    URL = "https://www.cdc.gov/wcms/vizdata/measles/MeaslesCasesWeekly.json"

    def collect(self) -> Optional[Dict[str, Any]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        weeks = sorted(resp.json(), key=lambda w: w["week_end"])
        # The newest week is still being reported; leave it out.
        complete = weeks[-5:-1]
        if len(complete) < 4:
            return None
        return self._create_reading(sum(int(w["cases"]) for w in complete), {
            "data_source": "CDC measles cases",
            "through_week_ending": complete[-1]["week_end"],
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        resp = requests.get(self.URL, headers=HEADERS, timeout=30)
        resp.raise_for_status()
        weeks = sorted(resp.json(), key=lambda w: w["week_end"])[:-1]
        out = []
        for i in range(3, len(weeks)):
            window = weeks[i - 3:i + 1]
            out.append((datetime.strptime(weeks[i]["week_end"], "%Y-%m-%d"), float(sum(int(w["cases"]) for w in window))))
        return out

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), int)


class SNAPParticipationCollector(BaseCollector):
    """People receiving SNAP nationally, in millions (USDA FNS monthly data, ~3 months behind)."""

    URL = "https://www.fna.usda.gov/sites/default/files/resource-files/snap-4fymonthly-9.xlsx"

    def _months(self) -> List[Tuple[datetime, float]]:
        import io

        import openpyxl

        resp = requests.get(self.URL, headers={"User-Agent": "Mozilla/5.0"}, timeout=60)
        resp.raise_for_status()
        sheet = openpyxl.load_workbook(io.BytesIO(resp.content), read_only=True, data_only=True).worksheets[0]
        months = []
        for row in sheet.iter_rows(values_only=True):
            label, persons = row[0], row[1] if len(row) > 1 else None
            if isinstance(label, str) and isinstance(persons, (int, float)):
                try:
                    months.append((datetime.strptime(label.strip(), "%b %Y"), round(persons / 1e6, 2)))
                except ValueError:
                    continue  # annual summary rows ("FY 2026")
        return sorted(months)

    def collect(self) -> Optional[Dict[str, Any]]:
        months = self._months()
        if not months:
            return None
        when, value = months[-1]
        year_ago = dict(months).get(when.replace(year=when.year - 1))
        return self._create_reading(value, {
            "data_source": "USDA FNS SNAP data tables",
            "month": when.strftime("%Y-%m"),
            "change_from_year_ago_pct": round((value / year_ago - 1) * 100, 1) if year_ago else None,
        })

    def history(self, years: int) -> List[Tuple[datetime, float]]:
        return self._months()

    def validate_data(self, data: Dict[str, Any]) -> bool:
        return isinstance(data.get("value"), float)
