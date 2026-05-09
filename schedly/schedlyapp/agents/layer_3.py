from .planner import generate
from .critic import critique



def run_layer3(tasks, state, constraints: dict) -> dict:
    """
    Layer 3 orchestrator.
    Runs Agent 1 then Agent 2 sequentially.
    Returns a payload ready for Layer 4 parallel simulation.

    Layer 4 receives:
      original_plans  — Agent 1's 3 plans
      mutated_plans   — Agent 2's 3 merged mutations
      agent1_reasoning — Agent 1's analysis
      agent2_critiques — Agent 2's per-plan verdicts
    """
    print("[Layer 3] Agent 1 generating plans...")
    agent1_output = generate(tasks, state, constraints)

    if not agent1_output.get("_validation", {}).get("ok"):
        print(f"[Layer 3] Agent 1 validation issues: {agent1_output['_validation']['issues']}")

    print("[Layer 3] Agent 2 critiquing plans...")
    agent2_output = critique(tasks, state, constraints, agent1_output)

    if not agent2_output.get("_validation", {}).get("ok"):
        print(f"[Layer 3] Agent 2 validation issues: {agent2_output['_validation']['issues']}")

    return {
        "original_plans": agent1_output.get("plans", []),
        "mutated_plans": agent2_output.get("mutated_plans", []),
        "agent1_reasoning": agent1_output.get("reasoning", ""),
        "agent2_critiques": agent2_output.get("critiques", []),
    }