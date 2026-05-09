from ..models import Task, ScheduleState
from schedlyapp.domain.mappers import map_task_to_data, map_user_state_to_data, map_schedule_request_to_data
from .compute_schedule_state import compute_schedule_state
from .detect_constraints import detect_constraints
from asgiref.sync import async_to_sync, sync_to_async
from ..agents.simulator import simulate_all
from ..agents.decision import decide
from ..agents.layer_3 import run_layer3

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
        },
    }
# sync wrapper — what Django calls
def run_planning_pipeline(schedule_request) -> dict:
    """
    Sync entry point for Django views.
    Wraps the async pipeline using asgiref's async_to_sync.
    """
    return async_to_sync(_run_async_pipeline)(schedule_request=schedule_request)
