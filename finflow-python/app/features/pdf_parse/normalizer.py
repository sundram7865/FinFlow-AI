import json
from langchain_core.messages import HumanMessage
from app.shared.llm import get_llm
from app.shared.prompts import PDF_EXTRACT_PROMPT
from app.core.logging import logger


async def extract_transactions_from_text(text: str) -> list[dict]:
    """
    Uses LLM to extract structured transactions from raw PDF text.
    Handles messy bank statement formats.
    """
    llm = get_llm()

    chunks = [text[i:i+3000] for i in range(0, len(text), 3000)]
    all_txns: list[dict] = []

    for chunk in chunks:
        if not chunk.strip():
            continue

        prompt   = PDF_EXTRACT_PROMPT.format(text=chunk)
        response = await llm.ainvoke([HumanMessage(content=prompt)])

        raw = response.content.strip()
        raw = raw.replace("```json", "").replace("```", "").strip()

        try:
            transactions = json.loads(raw)
            if isinstance(transactions, list):
                all_txns.extend(transactions)
        except json.JSONDecodeError:
            logger.warning("LLM returned invalid JSON for PDF chunk — skipping")

    logger.info(f"Extracted {len(all_txns)} transactions from PDF")
    return all_txns