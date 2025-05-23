import csv
import datetime as dt
import json
import os
from pathlib import Path
from typing import Dict, Any, List

import requests


LOG_PATH = Path(r"C:\Users\abrah\AI Agents\Aladdin_AI_Trader\executors\genie_top3_v3_tradelog.jsonl")
OUTPUT_PATH = LOG_PATH.with_name("filled_trades_merged.csv")

API_BASE_URL = os.getenv("APCA_API_BASE_URL", "https://paper-api.alpaca.markets")
API_KEY = os.getenv("APCA_API_KEY_ID")
API_SECRET = os.getenv("APCA_API_SECRET_KEY")


def fetch_filled_trades() -> List[Dict[str, Any]]:
    """Fetch all filled orders in the last 30 days from Alpaca."""
    end = dt.datetime.utcnow()
    start = end - dt.timedelta(days=30)

    url = f"{API_BASE_URL}/v2/orders"
    headers = {
        "APCA-API-KEY-ID": API_KEY or "",
        "APCA-API-SECRET-KEY": API_SECRET or "",
    }
    params = {
        "status": "filled",
        "after": start.isoformat(),
        "until": end.isoformat(),
        "direction": "asc",
        "limit": 500,
    }

    orders: List[Dict[str, Any]] = []
    while True:
        resp = requests.get(url, headers=headers, params=params)
        resp.raise_for_status()
        data = resp.json()
        orders.extend(data)
        # Alpaca uses pagination via 'next' link header
        if resp.links.get("next"):
            url = resp.links["next"]["url"]
            params = None
        else:
            break

    trades = []
    for o in orders:
        trades.append({
            "symbol": o.get("symbol"),
            "side": o.get("side"),
            "filled_qty": o.get("filled_qty"),
            "avg_fill_price": o.get("filled_avg_price"),
            "order_id": o.get("id"),
            "client_order_id": o.get("client_order_id"),
            "filled_at": o.get("filled_at"),
        })
    return trades


def read_log_entries(path: Path) -> Dict[str, Dict[str, Any]]:
    """Read log file and return a mapping of client_order_id to log entry."""
    entries: Dict[str, Dict[str, Any]] = {}
    if not path.exists():
        return entries
    with path.open("r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if not line:
                continue
            try:
                obj = json.loads(line)
            except json.JSONDecodeError:
                continue
            cid = obj.get("client_order_id") or obj.get("client_orderID")
            if cid:
                entries[cid] = obj
    return entries


def merge_trades_with_logs(trades: List[Dict[str, Any]], logs: Dict[str, Dict[str, Any]]):
    merged = []
    for trade in trades:
        cid = trade.get("client_order_id")
        log = logs.get(cid)
        if log:
            merged.append({**trade, **{"log_entry": json.dumps(log)}})
        else:
            merged.append({**trade, **{"log_entry": "no log entry found"}})
    return merged


def write_csv(rows: List[Dict[str, Any]], path: Path):
    if not rows:
        return
    fieldnames = list(rows[0].keys())
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main():
    trades = fetch_filled_trades()
    logs = read_log_entries(LOG_PATH)
    merged = merge_trades_with_logs(trades, logs)
    write_csv(merged, OUTPUT_PATH)
    print(f"Merged data written to {OUTPUT_PATH}")


if __name__ == "__main__":
    main()
