from .entities import TaskData, UserStateData, ScheduleStateData, ScheduleRequestData
from schedlyapp.task_schedule import compute_schedule_condition

def map_task_to_data(task):
   return {
        "id": task.id,
        "user": task.user.id if task.user else None,
        "title": task.title,
        "body": task.body,
        "remaining_hours": float(task.remaining_hours),
        "priority_level": task.priority_level,
        "energy_required": task.energy_required,
        "status": task.status,
        "schedule_condition": compute_schedule_condition(task),
        "level": task.level,
        "start_date": task.start_date.isoformat() if task.start_date else None,
        "deadline": task.deadline.isoformat() if task.deadline else None,
        "created_at": task.created_at.isoformat() if task.created_at else None,
    }
    
def map_user_state_to_data(user_state):
    return {
        "id":user_state.id,
        "energy_level":user_state.energy_level,
        "fatigue_level":user_state.fatigue_level,
        "sleep_hours":user_state.sleep_hours,
        "created_at":user_state.created_at.isoformat() if user_state.created_at else None,
    }
    
def map_schedule_state_to_data(schedule_state):
    return {
        "id":schedule_state.id,
        "schedule_request":schedule_state.schedule_request,
        "user":schedule_state.user,
        "total_task_hours":schedule_state.total_task_hours,
        "overload_hours":schedule_state.overload_hours,
        "capacity_hours":schedule_state.capacity_hours,
        "overloaded":schedule_state.overloaded,
        "fatigue_score":schedule_state.fatigue_score,
        "effective_energy":schedule_state.effective_energy,
        "created_at":schedule_state.created_at.isoformat() if schedule_state.created_at else None,
    }
    
def map_schedule_request_to_data(schedule_request):
    return{
        "id":schedule_request.id,
        "user":schedule_request.user,
        "available_hours":schedule_request.available_hours,
        "created_at":schedule_request.created_at.isoformat() if schedule_request.created_at else None,
    }
    
    
