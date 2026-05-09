import asyncio
import json
import time

from langchain_core.output_parsers import JsonOutputParser
from langchain_core.prompts import ChatPromptTemplate
from langsmith import traceable

from ..llm import get_chat_llm


llm = get_chat_llm(temperature=0.4, max_tokens=300)
parser = JsonOutputParser()


interpret_prompt = ChatPromptTemplate.from_template("""
You are explaining a schedule simulation result to the user in plain language.
Be direct and specific. Reference the actual numbers. 2-3 sentences maximum.

PLAN TYPE: {plan_type}
ACTIONS TAKEN: {actions}
USER STATE: {state}

MATH SCORES:
- Completion rate: {completion_rate} (how much of the workload gets done)
- Projected fatigue by end of day: {fatigue_end} (0=fresh, 1=burnt out)
- Overload delta: {overload_delta} (positive=pressure relieved, negative=still overloaded)
- Stability: {stability} (resilience if a task runs over time)
- Composite score: {score}

Write a JSON object with one key "summary" - a 2-3 sentence plain-language
explanation of why this plan scored the way it did. Reference specific numbers.
No markdown. Return ONLY valid JSON.

{{"summary": "your explanation here"}}
""")


def _compute_metrics(plan: dict, state: dict, tasks: list) -> dict:
    task_map = {t["id"]: t for t in tasks}

    fatigue_score = float(state.get("fatigue_score", 0.1))
    effective_energy = float(state.get("effective_energy", 0.5))
    total_task_hours = float(state.get("total_task_hours", 1))
    capacity_hours = float(state.get("capacity_hours", 8))

    energy_drain_factor = 1 - effective_energy
    effective_hours = 0.0
    high_energy_risk = 0
    total_actions = len(plan.get("actions", []))

    for action in plan.get("actions", []):
        task_id = action.get("task_id")
        action_name = action.get("action", "proceed")
        task = task_map.get(task_id, {})

        remaining = float(task.get("remaining_hours", 0))
        energy_required = task.get("energy_required", "medium")

        if action_name == "proceed":
            effective_hours += remaining
            if energy_required == "high" and fatigue_score > 0.6:
                high_energy_risk += 1
        elif action_name == "compress":
            new_hours = float(action.get("new_hours", remaining * 0.7))
            effective_hours += new_hours
            if energy_required == "high" and fatigue_score > 0.6:
                high_energy_risk += 1

    completion_rate = (
        min(effective_hours / total_task_hours, 1.0) if total_task_hours > 0 else 0.0
    )
    fatigue_end = min(
        fatigue_score + (effective_hours * energy_drain_factor / max(capacity_hours, 1)),
        1.0,
    )
    overload_delta = (
        (capacity_hours - effective_hours) / capacity_hours if capacity_hours > 0 else 0.0
    )
    overload_delta = max(min(overload_delta, 1.0), -1.0)
    stability = 1 - (high_energy_risk / total_actions) if total_actions > 0 else 1.0

    score = (
        completion_rate * 0.35
        + (1 - fatigue_end) * 0.30
        + overload_delta * 0.20
        + stability * 0.15
    )
    score = max(min(score, 1.0), 0.0)

    return {
        "completion_rate": round(completion_rate, 3),
        "fatigue_end": round(fatigue_end, 3),
        "overload_delta": round(overload_delta, 3),
        "stability": round(stability, 3),
        "score": round(score, 3),
    }


async def _interpret(plan: dict, state: dict, metrics: dict) -> str:
    chain = interpret_prompt | llm | parser

    result = await chain.ainvoke(
        {
            "plan_type": plan.get("plan_type", "unknown"),
            "actions": json.dumps(plan.get("actions", []), indent=2),
            "state": json.dumps(state, indent=2),
            "completion_rate": metrics["completion_rate"],
            "fatigue_end": metrics["fatigue_end"],
            "overload_delta": metrics["overload_delta"],
            "stability": metrics["stability"],
            "score": metrics["score"],
        }
    )

    return result.get("summary", "")


async def _simulate_one(plan: dict, state: dict, tasks: list) -> dict:
    metrics = _compute_metrics(plan, state, tasks)
    summary = await _interpret(plan, state, metrics)

    return {
        "plan_type": plan.get("plan_type"),
        "score": metrics["score"],
        "metrics": {
            "completion": metrics["completion_rate"],
            "fatigue": metrics["fatigue_end"],
            "overload": metrics["overload_delta"],
            "stability": metrics["stability"],
        },
        "summary": summary,
        "actions": plan.get("actions", []),
    }


@traceable(name="layer4_simulator", run_type="chain", tags=["layer4", "simulate", "amd"])
async def simulate_all(layer3_output: dict, state: dict, tasks: list) -> dict:
    original_plans = layer3_output.get("original_plans", [])
    mutated_plans = layer3_output.get("mutated_plans", [])
    all_plans = original_plans + mutated_plans

    print(f"[Layer 4] Simulating {len(all_plans)} plans in parallel...")
    start = time.perf_counter()

    results = await asyncio.gather(
        *[_simulate_one(plan, state, tasks) for plan in all_plans]
    )

    wall_time = round(time.perf_counter() - start, 3)
    print(f"[Layer 4] All simulations completed in {wall_time}s")

    results = list(results)
    best = max(results, key=lambda result: result["score"])

    return {
        "results": results,
        "benchmark": {
            "wall_time_seconds": wall_time,
            "plans_simulated": len(all_plans),
        },
        "best_plan": best["plan_type"],
    }
