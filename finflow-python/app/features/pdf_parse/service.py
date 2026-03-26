from app.features.pdf_parse.schemas    import ParseRequest, ParseResponse
from app.features.pdf_parse.extractor  import download_and_extract
from app.features.pdf_parse.normalizer import extract_transactions_from_text
from app.agents.tools.rag_tools        import save_pdf_chunks,delete_pdf_chunks
from app.shared.embeddings             import embed_texts
from app.core.logging                  import logger

async def parse_statement(request: ParseRequest) -> ParseResponse:
    """
    Full PDF parse pipeline:
    1. Download from Cloudinary
    2. Extract text with pdfplumber
    3. LLM normalizes to structured transactions
    4. Embed page chunks and save to MongoDB for RAG
    """
    full_text, pages = await download_and_extract(request.fileUrl)

    transactions = await extract_transactions_from_text(full_text)

    # Build chunks for RAG
    chunks = []

    for txn in transactions:
        content = f"{txn.get('type')} of ₹{txn.get('amount')} at {txn.get('description', '')} on {txn.get('date')}"

        embedding = embed_texts([content])[0]

        chunks.append({
        "userId":    request.userId,
        "uploadId":  request.uploadId,
        "content":   content,
        "embedding": embedding,
        "amount":    txn.get("amount"),
        "type":      txn.get("type"),
        "category":  txn.get("category"),
        "date":      txn.get("date"),
    })
    await delete_pdf_chunks(request.userId, request.uploadId)
    await save_pdf_chunks(request.userId, request.uploadId, chunks)
    logger.info(f"Saved {len(chunks)} PDF chunks to MongoDB for user {request.userId}")

    return ParseResponse(
        transactions=transactions,
        chunks_saved=len(chunks),
    )