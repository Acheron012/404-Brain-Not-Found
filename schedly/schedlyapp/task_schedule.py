from django.utils import timezone


def compute_schedule_condition(task) -> str:
    now = timezone.now()

    if task.status in {"finished", "cancelled", "dropped", "delayed", "missed"}:
        return task.status
    if task.deadline < now:
        return "missed"
    if task.status == "in_progress" and task.start_date > now:
        return "early_start"
    if task.start_date > now:
        return "upcoming"
    if task.status in {"not_yet_started", "pending"} and task.start_date <= now:
        return "delayed"
    return "on_track"
