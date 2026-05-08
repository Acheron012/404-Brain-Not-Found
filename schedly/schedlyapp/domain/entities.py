from dataclasses import dataclass
from datetime import datetime
from typing import List, Optional

@dataclass
class TaskData:
    id: int
    user: int
    title: str
    body: Optional[str]
    remaining_hours: float
    priority_level: str
    energy_required: str
    status: str
    level: str
    deadline: Optional[datetime]
    created_at: datetime

@dataclass
class UserStateData:
    id: int
    energy_level: str
    fatigue_level: str
    sleep_hours: int
    created_at: datetime
    
@dataclass
class ScheduleRequestData:
    id: int
    user: int
    available_hours: float
    created_at: datetime
    
@dataclass
class ScheduleStateData:
    id: int
    schedule_request: int
    user: int
    total_task_hours: float
    overload_hours: float
    capacity_hours: float
    overloaded: bool
    fatigue_score: float
    effective_energy: float
    created_at: datetime
    
@dataclass
class PlanDecisionData:
    id: int
    schedule_request: int
    selected_plan: str
    score: float
    metrics: dict
    created_at: datetime