from rest_framework.viewsets import ModelViewSet
from rest_framework.response import Response
from rest_framework.decorators import action
from rest_framework import status
from .serializers import UserStateSerializer, ScheduleRequestSerializer, TaskSerializer
from .models import UserState, Task, ScheduleRequest, PlanDecision
from .services.pipeline import run_planning_pipeline


class UserStateViewSet(ModelViewSet):
    """ViewSet for UserState model."""
    queryset = UserState.objects.all()
    serializer_class = UserStateSerializer
    
class TaskViewSet(ModelViewSet):
    """ViewSet for Task model."""
    queryset = Task.objects.all()
    serializer_class = TaskSerializer
    
    def get_queryset(self):
       """Filter tasks by user if ?user=<id> is provided. Otherwise, return all tasks."""
       queryset = super().get_queryset()
       user_id = self.request.GET.get('user')
       
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
       user_id = self.request.GET.get('user')
       
       if user_id is not None:
           queryset = queryset.filter(user_id=user_id)
       return queryset  
    
    @action(detail=False, methods=['post'])
    def generate_plan(self, request):
        """Custom action to generate a schedule plan based on the ScheduleRequest."""
        
        # Create the ScheduleRequest instance from the request data
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        schedule_request = serializer.save()

        # Pipeline entry point: pulls tasks/state from DB inside the pipeline.
        # Sync wrapper wraps async agent stack (layers 3–5).
        try:
            result = run_planning_pipeline(schedule_request=schedule_request)
        except Exception as e:
            return Response(
                {"error": f"Pipeline failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        plan_data = result["plan_decision"]

        saved_decision = PlanDecision.objects.create(
            schedule_request=schedule_request,
            selected_plan=plan_data["selected_plan"],
            score=plan_data["score"],
            metrics=plan_data["metrics"],
        )

        agent1_debug = result.get("debug", {}).get("agent1", {})
        # Three cards in the frontend read `plans` with plan_type / stance / actions.
        frontend_plans = []
        for p in agent1_debug.get("plans", []) or []:
            frontend_plans.append(
                {
                    "plan_type": p.get("plan_type"),
                    "stance": p.get("stance"),
                    "actions": p.get("actions", []),
                }
            )

        return Response(
            {
                # Top-level payload expected by frontend `normalizeSuggestions`
                "reasoning": plan_data.get("reasoning", ""),
                "plans": frontend_plans,
                "schedule_request": ScheduleRequestSerializer(schedule_request).data,
                "best_plan": {
                    "selected_plan": plan_data["selected_plan"],
                    "score": plan_data["score"],
                    "metrics": plan_data["metrics"],
                },
                "decision": {
                    "id": saved_decision.id,
                    "selected_plan": saved_decision.selected_plan,
                    "score": saved_decision.score,
                    "metrics": saved_decision.metrics,
                    "reasoning": plan_data.get("reasoning", ""),
                },
                "debug": result.get("debug", {}),
            },
            status=status.HTTP_201_CREATED,
        )

