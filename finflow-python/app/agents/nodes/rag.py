from langchain_core.messages import HumanMessage
from app.agents.graph.state import FinFlowState
from app.shared.llm import get_llm
from app.shared.prompts import RAG_PROMPT
from app.agents.tools.rag_tools import search_pdf_chunks


async def rag_node(state: FinFlowState) -> dict:
    """
    Embeds the user question.
    Searches MongoDB for matching PDF chunks.
    Generates answer grounded in document context.
    Writes rag_output to state.
    """
    llm     = get_llm()
    user_id = state.get("user_id", "")

    last_message = ""
    for msg in reversed(state["messages"]):
        if hasattr(msg, "content"):
            last_message = msg.content
            break

    chunks  = await search_pdf_chunks(user_id, last_message, top_k=3)
    context = "\n\n".join(
        f"[Page {c.get('pageNum', '?')}]: {c.get('content', '')}"
        for c in chunks
    ) or "No relevant document sections found."

    prompt   = RAG_PROMPT.format(
        message=last_message,
        context=context,
    )
    response = await llm.ainvoke([HumanMessage(content=prompt)])

    return {"rag_output": response.content}