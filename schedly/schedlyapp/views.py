from rest_framework import status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.viewsets import ModelViewSet

from .models import PlanDecision, ScheduleRequest, Task, UserState
from .serializers import (
    PlanDecisionSerializer,
    ScheduleRequestSerializer,
    TaskSerializer,
    UserStateSerializer,
)
from .services.pipeline import run_planning_pipeline


class UserStateViewSet(ModelViewSet):
    """ViewSet for UserState model."""
    queryset = UserState.objects.order_by("id")
    serializer_class = UserStateSerializer

    def create(self, request, *args, **kwargs):
        """
        Enforce single-user mode for the app.
        If a UserState already exists, update and return that canonical record
        instead of creating a second user row.
        """
        existing_user = self.get_queryset().first()
        if existing_user is not None:
            serializer = self.get_serializer(
                existing_user,
                data=request.data,
                partial=False,
            )
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return super().create(request, *args, **kwargs)

class TaskViewSet(ModelViewSet):
    """ViewSet for Task model."""

    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def get_queryset(self):
        """Filter tasks by user if ?user=<id> is provided. Otherwise, return all tasks."""
        queryset = super().get_queryset()
        user_id = self.request.GET.get("user")

        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset


class ScheduleRequestViewSet(ModelViewSet):
    """ViewSet for ScheduleRequest model."""

    queryset = ScheduleRequest.objects.all()
    serializer_class = ScheduleRequestSerializer

    def get_queryset(self):
        """Filter schedule requests by user if ?user=<id> is provided. Otherwise, return all schedule requests."""
        queryset = super().get_queryset()
        user_id = self.request.GET.get("user")

        if user_id is not None:
            queryset = queryset.filter(user_id=user_id)
        return queryset

    @action(detail=False, methods=["post"])
    def generate_plan(self, request):
        """Create a schedule request and run the full planning pipeline."""
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule_request = serializer.save()

        try:
            result = run_planning_pipeline(schedule_request)
        except Exception as exc:
            return Response(
                {"error": f"Pipeline failed: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        plan_data = result["plan_decision"]
        decision = PlanDecision.objects.create(
            schedule_request=schedule_request,
            selected_plan=plan_data["selected_plan"],
            score=plan_data["score"],
            metrics=plan_data["metrics"],
        )

        agent1 = result["debug"]["agent1"]

        return Response(
            {
                "schedule_request": ScheduleRequestSerializer(schedule_request).data,
                "reasoning": agent1["reasoning"],
                "plans": agent1["plans"],
                "decision": {
                    "id": decision.id,
                    "selected_plan": decision.selected_plan,
                    "score": decision.score,
                    "metrics": decision.metrics,
                    "reasoning": plan_data["reasoning"],
                },
                "best_plan": PlanDecisionSerializer(decision).data,
                "debug": result["debug"],
            },
            status=status.HTTP_201_CREATED,
        )
