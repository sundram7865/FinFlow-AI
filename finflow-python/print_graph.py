import os
os.environ["GROQ_API_KEY"] = "dummy"
os.environ["MONGODB_URI"]  = "mongodb://localhost:27017"
os.environ["INTERNAL_KEY"] = "dummy"

from rich.console import Console
from rich.panel import Panel
from app.agents.graph.builder import build_graph

graph   = build_graph()
mermaid = graph.get_graph().draw_ascii()

console = Console()
console.print(Panel(mermaid, title="FinFlow Graph", border_style="green"))