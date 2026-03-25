from typing import TypedDict, Annotated, Optional
from langgraph.graph.message import add_messages


class FinFlowState(TypedDict):
    # conversation
    messages:        Annotated[list, add_messages]
    user_id:         str

    # context sent from Node.js
    transactions:    list
    goals:           list
    memory:          list

    # routing
    intent:          str   # ANALYSIS | ADVICE | GOAL | RAG | GENERAL

    # agent outputs
    analyst_output:  str
    advisor_output:  str
    planner_output:  str
    rag_output:      str

    # final
    final_response:  str
    anomalies:       list
    new_memories:    list