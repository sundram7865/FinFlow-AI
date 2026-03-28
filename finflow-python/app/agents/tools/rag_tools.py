import datetime

from app.db.mongo import get_db
from app.shared.embeddings import embed_text
from app.core.logging import logger

PDF_COLLECTION = "pdf_chunks"


# ─────────────────────────────────────────────────────────────
# 🔍 SEARCH (UPDATED)
# ─────────────────────────────────────────────────────────────
async def search_pdf_chunks(
    user_id: str,
    query: str,
    top_k: int = 20,
    mongo_filter: dict | None = None
) -> list[dict]:

    db = get_db()
    collection = db[PDF_COLLECTION]

    query_embed = embed_text(query)

    match_stage = mongo_filter if mongo_filter else {"userId": user_id}

    pipeline = [
        {"$match": match_stage},

        # ── compute similarity ─────────────────────────────
        {
            "$addFields": {
                "similarity": {
                    "$reduce": {
                        "input": {
                            "$zip": {"inputs": ["$embedding", query_embed]}
                        },
                        "initialValue": 0,
                        "in": {
                            "$add": [
                                "$$value",
                                {
                                    "$multiply": [
                                        {"$arrayElemAt": ["$$this", 0]},
                                        {"$arrayElemAt": ["$$this", 1]}
                                    ]
                                }
                            ]
                        }
                    }
                }
            }
        },

        # ── normalize amount (boost high transactions) ─────
        {
            "$addFields": {
                "amount_score": {
                    "$log10": {"$add": ["$amount", 1]}
                }
            }
        },

        # ── recency boost (newer = higher) ────────────────
        {
            "$addFields": {
                "recency_score": {
                    "$divide": [
                        {"$subtract": [datetime.datetime.utcnow().timestamp(), {"$toDouble": {"$toDate": "$date"}}]},
                        -1000000000
                    ]
                }
            }
        },

        # ── final ranking ────────────────────────────────
        {
            "$addFields": {
                "final_score": {
                    "$add": [
                        "$similarity",
                        {"$multiply": ["$amount_score", 0.3]},
                        {"$multiply": ["$recency_score", 0.1]},
                    ]
                }
            }
        },

        {"$sort": {"final_score": -1}},
        {"$limit": top_k},

        {
            "$project": {
                "_id": 0,
                "content": 1,
                "amount": 1,
                "type": 1,
                "category": 1,
                "date": 1,
                "similarity": 1,
                "final_score": 1,
            }
        },
    ]

    cursor = collection.aggregate(pipeline)
    results = await cursor.to_list(length=top_k)

    logger.info(f"[RAG] Found {len(results)} chunks (optimized)")
    return results


async def save_pdf_chunks(
    user_id: str,
    upload_id: str,
    chunks: list[dict]
) -> None:

    if not chunks:
        return

    db = get_db()
    collection = db[PDF_COLLECTION]

    await collection.insert_many(chunks)

    logger.info(f"Inserted {len(chunks)} chunks for upload {upload_id}")



async def delete_pdf_chunks(
    userId: str,
    uploadId: str
) -> None:

    db = get_db()
    collection = db[PDF_COLLECTION]

    result = await collection.delete_many({
        "userId": userId,
        "uploadId": uploadId
    })

    logger.info(f"Deleted {result.deleted_count} old chunks")