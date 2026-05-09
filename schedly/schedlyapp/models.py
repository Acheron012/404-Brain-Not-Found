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
    
    def __str__(self):
        return f"UserState {self.id} - Energy: {self.energy_level}, Fatigue: {self.fatigue_level}, Sleep Hours: {self.sleep_hours}"
    
class Task(models.Model):
    """Created when the user creates a task."""
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserState, on_delete=models.CASCADE)
    title = models.CharField(max_length=50,null=False, blank=False)
    body = models.TextField(max_length=200, blank=True)
    remaining_hours = models.FloatField()
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
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('delayed', 'Delayed'),
            ('in_progress', 'In Progress'),
            ('finished', 'Finished'),
            ('dropped', 'Dropped'),
            ('cancelled', 'Cancelled'),
            ('missed', 'Missed'),
            ('not_yet_started', 'Not Yet Started')
        ],
        default='not_yet_started'
    )
    level = models.CharField(
        max_length=10,
        choices=[
            ('easy', 'Easy'),
            ('medium', 'Medium'),
            ('hard', 'Hard')
        ]
    )
    start_date = models.DateTimeField()
    deadline = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Task {self.id} (User {self.user}) - Title: {self.title}, Remaining Hours: {self.remaining_hours}, Priority: {self.priority_level}, Energy Required: {self.energy_required}, Status: {self.status}, Level: {self.level}, Deadline: {self.deadline}"

class ScheduleRequest(models.Model):
    id = models.AutoField(primary_key=True)
    user = models.ForeignKey(UserState, on_delete=models.CASCADE)
    available_hours = models.FloatField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    
    def __str__(self):
        return f"ScheduleRequest {self.id} (User {self.user}) - Available Hours: {self.available_hours}"
    
class ScheduleState(models.Model):
    """Schedule State is an output from the system to determine the user's schedule disposition"""
    id = models.AutoField(primary_key=True)
    schedule_request = models.ForeignKey(ScheduleRequest, on_delete=models.CASCADE)
    user = models.ForeignKey(UserState, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    total_task_hours = models.FloatField()
    overload_hours = models.FloatField()
    capacity_hours = models.FloatField()
    overloaded = models.BooleanField()
    fatigue_score = models.FloatField(default=0.1)
    effective_energy = models.IntegerField()
    
    def __str__(self):
        return f"ScheduleState {self.id} (User {self.user}) - Total Task Hours: {self.total_task_hours}, Overload Hours: {self.overload_hours}, Capacity Hours: {self.capacity_hours}, Overloaded: {self.overloaded}, Effective Energy: {self.effective_energy}"  
    
    
class PlanDecision(models.Model):
    """Output from the system to determine the best plan for the user"""
    id = models.AutoField(primary_key=True)
    schedule_request = models.ForeignKey(ScheduleRequest, on_delete=models.CASCADE)
    selected_plan = models.CharField(max_length=50)
    score = models.FloatField()
    metrics = models.JSONField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"PlanDecision {self.id} (ScheduleRequest {self.schedule_request}) - Selected Plan: {self.selected_plan}, Score: {self.score}, Metrics: {self.metrics}"
