from langgraph.graph import StateGraph, END
from app.agents.graph.state  import FinFlowState
from app.agents.graph.edges  import route_after_rag
from app.agents.nodes.supervisor     import supervisor_node
from app.agents.nodes.rag_retriever  import rag_retriever_node
from app.agents.nodes.analyst        import analyst_node
from app.agents.nodes.advisor        import advisor_node
from app.agents.nodes.planner        import planner_node
from app.agents.nodes.general        import general_node
from app.agents.nodes.aggregator     import aggregator_node
from app.agents.nodes.memory_writer  import memory_writer_node
from app.core.logging import logger
from functools import lru_cache


@lru_cache()
def build_graph():
    """
    Builds and compiles the FinFlow LangGraph state machine.
    Cached — only built once per process startup.

    Graph flow:
        supervisor
            ↓ (always)
        rag_retriever          ← mandatory for every query
            ↓ (conditional on state.next_node)
        analyst | advisor | planner | general
            ↓ (always)
        aggregator
            ↓ (always)
        memory_writer
            ↓ (always)
        END
    """
    logger.info("[Builder] Building FinFlow LangGraph...")

    graph = StateGraph(FinFlowState)

    # ── register nodes ───────────────────────────────────────
    graph.add_node("supervisor",     supervisor_node)
    graph.add_node("rag_retriever",  rag_retriever_node)   # NEW — always runs
    graph.add_node("analyst",        analyst_node)
    graph.add_node("advisor",        advisor_node)
    graph.add_node("planner",        planner_node)
    graph.add_node("general",        general_node)
    graph.add_node("aggregator",     aggregator_node)
    graph.add_node("memory_writer",  memory_writer_node)

    # ── entry point ──────────────────────────────────────────
    graph.set_entry_point("supervisor")

    # ── supervisor → rag_retriever (always, no branching here) ──
    graph.add_edge("supervisor", "rag_retriever")

    # ── rag_retriever → agent (conditional on state.next_node) ──
    graph.add_conditional_edges(
        "rag_retriever",
        route_after_rag,
        {
            "analyst": "analyst",
            "advisor": "advisor",
            "planner": "planner",
            "general": "general",
        },
    )

    # ── all agents → aggregator ──────────────────────────────
    graph.add_edge("analyst",  "aggregator")
    graph.add_edge("advisor",  "aggregator")
    graph.add_edge("planner",  "aggregator")
    graph.add_edge("general",  "aggregator")

    # ── aggregator → memory_writer → END ────────────────────
    graph.add_edge("aggregator",    "memory_writer")
    graph.add_edge("memory_writer", END)

    compiled = graph.compile()
    logger.info("[Builder] FinFlow LangGraph compiled successfully ✅")
    return compiled