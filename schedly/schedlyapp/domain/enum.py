from enum import Enum

class LeveL(Enum):
    LOW = 'low'
    MEDIUM = 'medium'
    HIGH = 'high'

class TaskStatus(Enum):
    PENDING = 'pending'
    DELAYED = 'delayed'
    IN_PROGRESS = 'in_progress'
    NOT_YET_STARTED = 'not_yet_started'
    FINISHED = 'finished'
    CANCELLED = 'cancelled'
    MISSED = 'missed'
    DROPPED = 'dropped'
    
class LevelStatus(Enum):
    EASY = 'easy'
    MEDIUM = 'medium'
    HARD = 'hard'