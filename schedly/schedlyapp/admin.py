from django.contrib import admin
from .models import UserState, Task, ScheduleRequest, ScheduleState, PlanDecision

admin.site.register(UserState)
admin.site.register(Task)
admin.site.register(ScheduleRequest)
admin.site.register(ScheduleState)
admin.site.register(PlanDecision)
