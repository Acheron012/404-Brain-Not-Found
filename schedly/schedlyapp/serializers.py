from rest_framework import serializers
from .models import UserState, Task, ScheduleRequest, ScheduleState, PlanDecision

class UserStateSerializer(serializers.ModelSerializer):
    """Serializer for UserState model."""
    class Meta:
        model = UserState
        fields = '__all__'
    
class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    class Meta:
        model = Task
        fields = '__all__'

    def validate_remaining_hours(self, value):
        """Validate that remaining_hours is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Remaining hours must be non-negative.")
        return value

    def validate_status(self, value):
        """
        Normalize legacy pending tasks into an explicit not-yet-started state.
        New progress should move through not_yet_started -> in_progress -> finished.
        """
        if value == "pending":
            return "not_yet_started"
        return value
    
    def validate_deadline(self, value):
        """Validate that deadline is in the future."""
        from django.utils import timezone
        if value < timezone.now():
            raise serializers.ValidationError("Deadline must be in the future.")
        return value
    
class ScheduleRequestSerializer(serializers.ModelSerializer):
    """Serializer for ScheduleRequest model."""
    class Meta:
        model = ScheduleRequest
        fields = '__all__'

    def validate_available_hours(self, value):
        """Validate that available_hours is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Available hours must be non-negative.")
        return value

class ScheduleStateSerializer(serializers.ModelSerializer):
    """Serializer for ScheduleState model."""
    class Meta:
        model = ScheduleState
        fields = '__all__'
        
class PlanDecisionSerializer(serializers.ModelSerializer):
    """Serializer for PlanDecision model."""
    class Meta:
        model = PlanDecision
        fields = '__all__'

