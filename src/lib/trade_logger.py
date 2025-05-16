# lib/trade_logger.py
import os, datetime, pymongo
MONGO_URI = os.getenv("MONGO_URI")  # same var in Render & Next.js
client = pymongo.MongoClient(MONGO_URI)
coll   = client['rokai']['realized_trades']      # DB name: rokai

def log_trade(trade: dict):
    """Insert or update a trade document."""
    # upsert by (symbol, entry_time, strategy) so repeated updates just patch pnl
    coll.update_one(
        {
            "symbol":    trade["symbol"],
            "entry_time": trade["entry_time"],
            "strategy":   trade["strategy"],
        },
        {"$set": trade},
        upsert=True,
    )

# usage from your bot:
# log_trade({
#     "symbol": "AAPL",
#     "side": "long",
#     "entry_time": datetime.datetime.utcnow().isoformat(),
#     "exit_time":  "... later ...",
#     "qty": 10,
#     "entry_price": 181.00,
#     "exit_price":  183.45,
#     "pnl": 24.5,
#     "strategy": "swing",
# })
