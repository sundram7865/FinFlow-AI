from langgraph.graph import StateGraph, END
from app.agents.graph.state import FinFlowState
from app.agents.graph.edges import route_by_intent
from app.agents.nodes.supervisor    import supervisor_node
from app.agents.nodes.analyst       import analyst_node
from app.agents.nodes.advisor       import advisor_node
from app.agents.nodes.planner       import planner_node
from app.agents.nodes.rag           import rag_node
from app.agents.nodes.general       import general_node
from app.agents.nodes.aggregator    import aggregator_node
from app.agents.nodes.memory_writer import memory_writer_node
from functools import lru_cache


@lru_cache()
def build_graph():
    """
    Builds and compiles the FinFlow LangGraph state machine.
    Cached — only built once on startup.
    """
    graph = StateGraph(FinFlowState)

    # ── register all nodes ──────────────────────────────────
    graph.add_node("supervisor",    supervisor_node)
    graph.add_node("analyst",       analyst_node)
    graph.add_node("advisor",       advisor_node)
    graph.add_node("planner",       planner_node)
    graph.add_node("rag",           rag_node)
    graph.add_node("general",       general_node)
    graph.add_node("aggregator",    aggregator_node)
    graph.add_node("memory_writer", memory_writer_node)

    # ── entry point ──────────────────────────────────────────
    graph.set_entry_point("supervisor")

    # ── conditional edges from supervisor ───────────────────
    graph.add_conditional_edges(
        "supervisor",
        route_by_intent,
        {
            "analyst": "analyst",
            "advisor": "advisor",
            "planner": "planner",
            "rag":     "rag",
            "general": "general",
        },
    )

    # ── fixed edges → aggregator ─────────────────────────────
    graph.add_edge("analyst",  "aggregator")
    graph.add_edge("advisor",  "aggregator")
    graph.add_edge("planner",  "aggregator")
    graph.add_edge("rag",      "aggregator")
    graph.add_edge("general",  "aggregator")

    # ── aggregator → memory_writer → END ────────────────────
    graph.add_edge("aggregator",    "memory_writer")
    graph.add_edge("memory_writer", END)

    return graph.compile()