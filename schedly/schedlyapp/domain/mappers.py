from .entities import TaskData, UserStateData, ScheduleStateData, ScheduleRequestData

def map_task_to_data(task):
    return TaskData(
        id=task.id,
        user=task.user,
        title=task.title,
        body=task.body,
        remaining_hours=task.remaining_hours,
        priority_level=task.priority_level,
        energy_required=task.energy_required,
        status=task.status,
        level=task.level,
        deadline=task.deadline,
        created_at=task.created_at
    )
    
def map_user_state_to_data(user_state):
    return UserStateData(
        id=user_state.id,
        energy_level=user_state.energy_level,
        fatigue_level=user_state.fatigue_level,
        sleep_hours=user_state.sleep_hours,
        created_at=user_state.created_at
    )
    
def map_schedule_state_to_data(schedule_state):
    return ScheduleStateData(
        id=schedule_state.id,
        schedule_request=schedule_state.schedule_request,
        user=schedule_state.user,
        total_task_hours=schedule_state.total_task_hours,
        overload_hours=schedule_state.overload_hours,
        capacity_hours=schedule_state.capacity_hours,
        overloaded=schedule_state.overloaded,
        fatigue_score=schedule_state.fatigue_score,
        effective_energy=schedule_state.effective_energy,
        created_at=schedule_state.created_at
    )
    
def map_schedule_request_to_data(schedule_request):
    return ScheduleRequestData(
        id=schedule_request.id,
        user=schedule_request.user,
        available_hours=schedule_request.available_hours,
        created_at=schedule_request.created_at
    )
    
