from rest_framework import serializers
from django.utils import timezone
from .models import UserState, Task, ScheduleRequest, ScheduleState, PlanDecision
from .task_schedule import compute_schedule_condition

class UserStateSerializer(serializers.ModelSerializer):
    """Serializer for UserState model."""
    class Meta:
        model = UserState
        fields = '__all__'
    
class TaskSerializer(serializers.ModelSerializer):
    """Serializer for Task model."""
    schedule_condition = serializers.SerializerMethodField()

    class Meta:
        model = Task
        fields = [
            'id',
            'user',
            'title',
            'body',
            'remaining_hours',
            'priority_level',
            'energy_required',
            'status',
            'level',
            'start_date',
            'deadline',
            'created_at',
            'schedule_condition',
        ]
        extra_kwargs = {
            'status': {'required': True},
            'start_date': {'required': True},
        }

    def validate_remaining_hours(self, value):
        """Validate that remaining_hours is non-negative."""
        if value < 0:
            raise serializers.ValidationError("Remaining hours must be non-negative.")
        return value

    def validate_start_date(self, value):
        """Validate that start_date is present and not after the deadline."""
        deadline = self.initial_data.get("deadline")
        if deadline:
            parsed_deadline = serializers.DateTimeField().to_internal_value(deadline)
            if value > parsed_deadline:
                raise serializers.ValidationError("Start date must be before or equal to the deadline.")
        return value
    
    def validate_deadline(self, value):
        """Validate that deadline is in the future."""
        if value < timezone.now():
            raise serializers.ValidationError("Deadline must be in the future.")
        return value

    def validate(self, attrs):
        start_date = attrs.get("start_date") or getattr(self.instance, "start_date", None)
        deadline = attrs.get("deadline") or getattr(self.instance, "deadline", None)

        if start_date is not None and deadline is not None and start_date > deadline:
            raise serializers.ValidationError(
                {"start_date": "Start date must be before or equal to the deadline."}
            )
        return attrs

    def get_schedule_condition(self, obj):
        return compute_schedule_condition(obj)
    
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

