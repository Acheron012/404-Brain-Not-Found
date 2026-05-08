# test_layer1.py

class Task:
    def __init__(self, id, remaining_hours, priority):
        self.id = id
        self.remaining_hours = remaining_hours
        self.priority_level = priority


class UserState:
    def __init__(self, energy_level, fatigue_level):
        self.energy_level = energy_level
        self.fatigue_level = fatigue_level


class ScheduleRequest:
    def __init__(self, available_hours):
        self.available_hours = available_hours

ENERGY_MAP = {
    "low": 0.3,
    "medium": 0.6,
    "high": 0.9
}

FATIGUE_MAP = {
    "low": 0.1,
    "medium": 0.3,
    "high": 0.5
}


def compute_schedule_state(tasks, user_state, schedule_request):
    total_task_hours = sum(t.remaining_hours for t in tasks)

    capacity_hours = schedule_request.available_hours

    overload_hours = max(0, total_task_hours - capacity_hours)
    overloaded = overload_hours > 0

    fatigue_score = FATIGUE_MAP[user_state.fatigue_level]

    normalized_energy = ENERGY_MAP[user_state.energy_level]
    effective_energy = max(0, normalized_energy - fatigue_score)

    return {
        "total_task_hours": total_task_hours,
        "capacity_hours": capacity_hours,
        "overload_hours": overload_hours,
        "overloaded": overloaded,
        "fatigue_score": fatigue_score,
        "effective_energy": effective_energy
    }
if __name__ == "__main__":
    tasks = [
        Task(1, 3, "high"),
        Task(2, 2, "medium"),
        Task(3, 2, "low")
    ]

    request = ScheduleRequest(
        available_hours=5
    )
    
    levels = ["low", "medium", "high"]

    for energy in levels:
        for fatigue in levels:
            user = UserState(energy, fatigue)
            result = compute_schedule_state(tasks, user, request)

            print(f"\nEnergy: {energy}, Fatigue: {fatigue}")
            print(f"Effective Energy: {result['effective_energy']}")

    result = compute_schedule_state(tasks, user, request)

    print("=== RESULT ===")
    for k, v in result.items():
        print(f"{k}: {v}")