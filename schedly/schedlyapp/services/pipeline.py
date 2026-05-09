from ..models import Task, ScheduleState
from schedlyapp.domain.mappers import map_task_to_data, map_user_state_to_data, map_schedule_request_to_data
from .compute_schedule_state import compute_schedule_state
from .detect_constraints import detect_constraints
from asgiref.sync import async_to_sync, sync_to_async
from ..agents.simulator import simulate_all
from ..agents.decision import decide
from ..agents.layer_3 import run_layer3

def _default_statement(task: dict, action: str, new_hours=None) -> str:
    task_name = task.get("title", f"Task {task.get('id')}")

    if action == "compress":
        if new_hours is not None:
            return (
                f"Suggest compressing {task_name} to {new_hours}h "
                f"from {task.get('remaining_hours')}h to reduce workload."
            )
        return f"Suggest compressing {task_name} to reduce workload."
    if action == "delay":
        return f"Suggest delaying {task_name} so higher-priority work can go first."
    if action == "drop":
        return f"Suggest dropping {task_name} from the current plan to protect time and energy."
    if action == "miss":
        return f"{task_name} is unlikely to happen in the current plan and is marked as missed."
    if action == "outsource":
        return f"Suggest outsourcing or delegating {task_name} instead of doing it directly."
    return f"Leave {task_name} unchanged. No additional action is suggested in this plan."


def _build_review_rows(tasks_data: list, layer3_output: dict) -> dict:
    task_lookup = {str(task["id"]): task for task in tasks_data}
    critiques_by_plan = {
        critique["plan_type"]: critique
        for critique in layer3_output.get("agent2_critiques", [])
    }

    review_rows_by_plan = {}
    all_plans = (
        layer3_output.get("original_plans", [])
        + layer3_output.get("mutated_plans", [])
    )

    for plan in all_plans:
        plan_type = plan.get("plan_type", "unknown")
        base_plan_type = plan_type.replace("_mutated", "")
        critique = critiques_by_plan.get(base_plan_type, {})
        mutation_map = {
            str(mutation["task_id"]): mutation
            for mutation in critique.get("mutations", [])
        }
        review_map = {
            str(review["task_id"]): review
            for review in critique.get("task_reviews", [])
        }
        action_map = {
            str(action["task_id"]): action
            for action in plan.get("actions", [])
        }

        rows = []
        for task_id, task in task_lookup.items():
            authored_review = review_map.get(task_id)
            if authored_review:
                rows.append(
                    {
                        "task_id": task["id"],
                        "task_name": task.get("title", f"Task {task['id']}"),
                        "action": authored_review.get("action", "proceed"),
                        "new_hours": authored_review.get("new_hours"),
                        "changed": bool(authored_review.get("changed", False)),
                        "statement": authored_review.get("statement")
                        or _default_statement(
                            task,
                            authored_review.get("action", "proceed"),
                            authored_review.get("new_hours"),
                        ),
                    }
                )
                continue

            action_payload = action_map.get(task_id, {})
            action = action_payload.get("action", "proceed")
            new_hours = action_payload.get("new_hours")
            mutation = mutation_map.get(task_id)
            changed = action != "proceed"

            if mutation and plan_type.endswith("_mutated"):
                statement = mutation.get("reason") or _default_statement(
                    task,
                    action,
                    new_hours,
                )
            else:
                statement = _default_statement(task, action, new_hours)

            rows.append(
                {
                    "task_id": task["id"],
                    "task_name": task.get("title", f"Task {task['id']}"),
                    "action": action,
                    "new_hours": new_hours,
                    "changed": changed,
                    "statement": statement,
                }
            )

        review_rows_by_plan[plan_type] = rows

    return review_rows_by_plan


async def _run_async_pipeline(schedule_request):
    
    tasks = await sync_to_async(list)(
        Task.objects.filter(
        user=schedule_request.user,
        status__in=['pending', 'delayed', 'not_yet_started', 'in_progress'],
        remaining_hours__gt=0
    ).select_related("user")
    )
    
    # Map to domain data structures and convert to dicts for JSON serialization
    tasks_data = [map_task_to_data(t) for t in tasks]
    
    user_state = schedule_request.user
    
    user_state_data = map_user_state_to_data(user_state)
    
    request_data = map_schedule_request_to_data(schedule_request)


    # Layer 2: Compute Constraints
    state = compute_schedule_state(tasks_data, user_state_data, request_data)
    
    await sync_to_async(ScheduleState.objects.create)(
        schedule_request=schedule_request,
        user=schedule_request.user,
        total_task_hours=state['total_task_hours'],
        overload_hours=state['overload_hours'],
        capacity_hours=state['capacity_hours'],
        overloaded=state['overloaded'],
        fatigue_score=state['fatigue_score'],
        effective_energy=state['effective_energy']
    )
    
    constraints = detect_constraints(state)
    
    print("\n[Pipeline] Starting Layer 3...")
    layer3_output = await sync_to_async(run_layer3)(tasks_data, state, constraints)
    
    # run layer 4: simulate and evaluate all plans from layer 3 in parallel, then pick the best one
    print("\n[Pipeline] Starting Layer 4...")
    layer4_output = await simulate_all(layer3_output, state, tasks_data)

    print(f"\n[Pipeline] Benchmark: {layer4_output['benchmark']}")
    print(f"[Pipeline] Math best: {layer4_output['best_plan']}")
    
    # run layer 5: decide the best plan based on simulation results and constraints
    print("\n[Pipeline] Starting Layer 5...")
    decision = decide(state, layer3_output, layer4_output, schedule_request.id)
    
    print(f"\n[Pipeline] Decision: {decision['selected_plan']} (score: {decision['score']})")
    print(f"[Pipeline] Reasoning: {decision['reasoning']}")
    print(f"\n[Pipeline] Simulation Result: {layer4_output['results']}")
    print(f"[Pipeline] Benchmark: {layer4_output['benchmark']}")


        # ── agent outputs (local visibility, not saved) ───────────────────
    # enrich plans with their simulation scores before returning
    sim_scores = {r["plan_type"]: r["score"] for r in layer4_output["results"]}
    review_rows_by_plan = _build_review_rows(tasks_data, layer3_output)

    return {
        "plan_decision": {
            "selected_plan": decision["selected_plan"],
            "score":         decision["score"],
            "metrics":       decision["metrics"],
            "reasoning":     decision["reasoning"],
        },
        "debug": {
            "agent1": {
                "reasoning": layer3_output["agent1_reasoning"],
                "plans": [
                    {**p, "score": sim_scores.get(p["plan_type"], 0.0)}
                    for p in layer3_output["original_plans"]
                ],
            },
            "agent2": {
                "critiques": layer3_output["agent2_critiques"],
                "mutated_plans": [
                    {**p, "score": sim_scores.get(p["plan_type"], 0.0)}
                    for p in layer3_output["mutated_plans"]
                ],
            },
            "layer4": {
                "all_simulations": layer4_output["results"],
                "benchmark":       layer4_output["benchmark"],
                "math_best":       layer4_output["best_plan"],
            },
            "reviews": review_rows_by_plan,
        },
    }
# sync wrapper — what Django calls
def run_planning_pipeline(schedule_request) -> dict:
    """
    Sync entry point for Django views.
    Wraps the async pipeline using asgiref's async_to_sync.
    """
    return async_to_sync(_run_async_pipeline)(schedule_request=schedule_request)
