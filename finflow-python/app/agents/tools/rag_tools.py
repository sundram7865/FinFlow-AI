from app.db.mongo import get_db
from app.shared.embeddings import embed_text


async def search_pdf_chunks(
    user_id: str,
    query: str,
    top_k: int = 3
) -> list[dict]:
    """
    Embeds the query and finds similar PDF chunks in MongoDB.
    Uses cosine similarity on stored embeddings.
    """
    db          = get_db()
    collection  = db["pdfchunks"]
    query_embed = embed_text(query)

    pipeline = [
        {"$match": {"userId": user_id}},
        {
            "$addFields": {
                "similarity": {
                    "$let": {
                        "vars": {
                            "dot": {
                                "$reduce": {
                                    "input": {"$zip": {"inputs": ["$embedding", query_embed]}},
                                    "initialValue": 0,
                                    "in": {"$add": ["$$value", {"$multiply": [{"$arrayElemAt": ["$$this", 0]}, {"$arrayElemAt": ["$$this", 1]}]}]},
                                }
                            }
                        },
                        "in": "$$dot",
                    }
                }
            }
        },
        {"$sort":  {"similarity": -1}},
        {"$limit": top_k},
        {"$project": {"content": 1, "pageNum": 1, "similarity": 1}},
    ]

    cursor = collection.aggregate(pipeline)
    return await cursor.to_list(length=top_k)


async def save_pdf_chunks(
    user_id:  str,
    upload_id: str,
    chunks:   list[dict]
) -> None:
    """Saves embedded PDF chunks to MongoDB."""
    db         = get_db()
    collection = db["pdfchunks"]

    if chunks:
        await collection.insert_many(chunks)