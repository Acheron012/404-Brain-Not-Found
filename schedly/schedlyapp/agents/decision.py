import json

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langsmith import traceable

from ..llm import get_chat_llm


llm = get_chat_llm(temperature=0.3, max_tokens=512)
parser = JsonOutputParser()


prompt = ChatPromptTemplate.from_template("""
You are the final decision agent for a wellness-aware schedule optimizer.
You have 6 simulated plans with scores. Your job is to pick the single best
plan for this user RIGHT NOW given their current state.

Do not just pick the highest score blindly. Consider:
- If fatigue_score > 0.7, heavily weight plans with lower fatigue_end
- If overload_hours > 0, prefer plans with positive overload_delta
- If effective_energy < 4, prefer plans with higher stability
- A plan that scores 0.72 on fatigue protection beats one at 0.75 overall
  if the user is already dangerously fatigued

USER STATE:
{state}

AGENT 1 REASONING:
{agent1_reasoning}

AGENT 2 CRITIQUES:
{agent2_critiques}

ALL 6 SIMULATION RESULTS:
{simulation_results}

FASTEST RESULT (math only, for reference):
{best_plan}

---

Decide which plan to recommend. Then explain why in 2-3 sentences,
referencing the user's actual state values and the specific scores
that drove your decision.

Return ONLY valid JSON:

{{
  "selected_plan": "the plan_type string exactly as it appears in results",
  "score": 0.0,
  "metrics": {{
    "completion": 0.0,
    "fatigue": 0.0,
    "overload": 0.0,
    "stability": 0.0
  }},
  "reasoning": "2-3 sentences citing actual numbers from state and scores"
}}
""")


def _extract_plan_metrics(selected_plan_type: str, simulation_results: list) -> dict:
    for result in simulation_results:
        if result["plan_type"] == selected_plan_type:
            return {
                "score": result["score"],
                "metrics": result["metrics"],
            }
    return {"score": 0.0, "metrics": {}}


@traceable(name="agent_3_decision", run_type="chain", tags=["agent", "decision", "layer3"])
def decide(
    state: dict,
    layer3_output: dict,
    layer4_output: dict,
    schedule_request_id: int,
) -> dict:
    """
    Agent 3 - Final decision maker.
    Reads all 6 simulation results and picks the optimal plan.
    """
    chain = prompt | llm | parser

    result = chain.invoke(
        {
            "state": json.dumps(state, indent=2),
            "agent1_reasoning": layer3_output.get("agent1_reasoning", ""),
            "agent2_critiques": json.dumps(
                layer3_output.get("agent2_critiques", []), indent=2
            ),
            "simulation_results": json.dumps(
                layer4_output.get("results", []), indent=2
            ),
            "best_plan": layer4_output.get("best_plan", ""),
        }
    )

    plan_data = _extract_plan_metrics(
        result.get("selected_plan", ""),
        layer4_output.get("results", []),
    )

    return {
        "schedule_request": schedule_request_id,
        "selected_plan": result.get("selected_plan", ""),
        "score": plan_data["score"],
        "metrics": plan_data["metrics"],
        "reasoning": result.get("reasoning", ""),
    }
