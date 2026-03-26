from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages


class FinFlowState(TypedDict):
    # ── conversation
    messages:        Annotated[list, add_messages]
    user_id:         str

    # ── context from Node.js payload
    goals:           list   # from PostgreSQL via Node
    memory:          list   # from MongoDB agentmemories via Node

    # ── supervisor sets these
    intent:          str    # ANALYSIS | ADVICE | GOAL | RAG | GENERAL
    rag_query:       str    # refined search query for MongoDB vector search
    next_node:       str    # which agent node to run after RAG retriever
    filters:         dict
    # ── RAG retriever fills this
    transactions:    list   # relevant chunks from MongoDB pdfchunks

    # ── agent outputs
    analyst_output:  str
    advisor_output:  str
    planner_output:  str
  

    # ── final
    final_response:  str
    anomalies:       list
    new_memories:    list