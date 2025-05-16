import os, time, json, pathlib, streamlit as st
import pandas as pd
from pymongo import MongoClient
from datetime import datetime

REFRESH_EVERY = 5        # seconds
MAX_ROWS       = 500     # per strategy

def load_from_mongo(uri):
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        db     = client.get_default_database()
        col    = db["trades"]
        docs   = list(col.find().sort("filled_at", -1).limit(MAX_ROWS))
        if not docs: return {}
        df     = pd.DataFrame(docs)
        return { s: df[df.strategy==s] for s in df.strategy.unique() }
    except Exception as e:
        st.warning(f"Mongo read failed: {e}")
        return {}

def load_from_logs(folder):
    result = {}
    for path in pathlib.Path(folder).glob("*.jsonl"):
        with open(path) as f:
            lines = f.readlines()[-MAX_ROWS:]
        if not lines: continue
        df = pd.DataFrame(json.loads(l) for l in lines)
        result[path.stem] = df
    return result

def nice(df):
    if "filled_at" in df.columns:
        df["filled_at"] = pd.to_datetime(df["filled_at"]).dt.tz_localize(None)
    return df.sort_values("filled_at", ascending=False).reset_index(drop=True)

st.set_page_config("RokAi – Live Trades", layout="wide")
st.title("🐦 RokAi / Hawk – Live Trades Dashboard")

while True:
    data = {}
    if os.getenv("MONGO_URL"):
        data.update(load_from_mongo(os.environ["MONGO_URL"]))
    data.update(load_from_logs(os.getenv("LOG_DIR", "./logs")))

    if not data:
        st.error("No trades found yet. Waiting…")
    else:
        tabs = st.tabs(list(data.keys()))
        for t, (name, df) in zip(tabs, data.items()):
            with t:
                dfn = nice(df)
                st.metric("Realised P&L $",
                          f"{dfn['pnl'].sum():,.2f}",
                          delta=f"{dfn['pnl'].iloc[0]:+.2f} last")
                st.dataframe(dfn, use_container_width=True)

    st.empty()           # clears queued elements on each loop
    time.sleep(REFRESH_EVERY)
    st.experimental_rerun()
