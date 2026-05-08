from ..models import Task, ScheduleState
from schedlyapp.domain.mappers import map_task_to_data, map_user_state_to_data, map_schedule_request_to_data
from .compute_schedule_state import compute_schedule_state
from .detect_constraints import detect_constraints
from ..agents.conservative import generate

def run_planning_pipeline(schedule_request):
    
    tasks = Task.objects.filter(
        user=schedule_request.user,
        status__in=['pending', 'delayed', 'not_yet_started', 'in_progress'],
        remaining_hours__gt=0
    )
    
    # Map to domain data objects
    tasks_data = [map_task_to_data(t) for t in tasks]
    
    user_state = schedule_request.user
    
    user_state_data = map_user_state_to_data(user_state)
    
    request_data = map_schedule_request_to_data(schedule_request)

    
    state = compute_schedule_state(tasks_data, user_state_data, request_data)
    
    constraints = ScheduleState.objects.create(
        schedule_request=schedule_request,
        user=schedule_request.user,
        total_task_hours=state['total_task_hours'],
        overload_hours=state['overload_hours'],
        capacity_hours=state['capacity_hours'],
        overloaded=state['overloaded'],
        fatigue_score=state['fatigue_score'],
        effective_energy=state['effective_energy']
    )
    
    constraint = detect_constraints(state)
    
    plan = generate(tasks_data, state, constraint)

    return constraint
