from django.db import models



    
class UserState(models.Model):
    """User State is an input from the user to determine their disposition"""
    id = models.AutoField(primary_key=True)
    energy_level = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ],
        default='high'
    )
    fatigue_level = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ], 
        default='low'
    )
    sleep_hours = models.IntegerField(null=False, blank=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
class Task(models.Model):
    """Created when the user creates a task."""
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(UserState, on_delete=models.CASCADE)
    title = models.CharField(max_length=50,null=False, blank=False)
    body = models.TextField(max_length=200, blank=True)
    remaining_hours = models.FloatField(max_length=10)
    priority_level = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ],
        default='medium'
    )
    energy_required = models.CharField(
        max_length=10,
        choices=[
            ('low', 'Low'),
            ('medium', 'Medium'),
            ('high', 'High')
        ]
    )
    status = models.CharField(
        max_length=15,
        choices=[
            ('pending', 'Pending'),
            ('in progress', 'In Progress'),
            ('done', 'Done')
        ],
        default='pending'
    )
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
class ScheduleRequest(models.Model):
    id = models.AutoField(primary_key=True)
    user_id = models.ForeignKey(UserState, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    available_hours = models.FloatField(max_length=10)
    
class ScheduleState(models.Model):
    id = models.AutoField(primary_key=True)
    schedule_request_id = models.ForeignKey(ScheduleRequest, on_delete=models.CASCADE)
    user_id = models.ForeignKey(UserState, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_task_hours = models.FloatField(max_length=10)
    