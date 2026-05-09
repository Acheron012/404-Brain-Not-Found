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
        
        
        # call the pipeline
        try:
            result = run_planning_pipeline(
                tasks=tasks,
                state=schedule_state,
                constraints=constraints,
                schedule_request_id=schedule_request.id,
            )
        except Exception as e:
            return Response(
                {"error": f"Pipeline failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        
        # store final decision
        plan_data = result["plan_decision"]
        PlanDecision.objects.create(
            schedule_request=schedule_request,
            selected_plan = plan_data['selected_plan'],
            score = plan_data['score'],
            metrics = plan_data['metrics']
        )
        
        return Response(
            {
                # what the frontend shows the user
                "schedule_request": ScheduleRequestSerializer(schedule_request).data,
                "decision": {
                    "id":            decision.id,
                    "selected_plan": decision.selected_plan,
                    "score":         decision.score,
                    "metrics":       decision.metrics,
                    "reasoning":     plan_data["reasoning"],
                },

                # everything teammates need locally — agents, scores, benchmark
                # strip this out before production with DEBUG check
                "debug": result["debug"],
            },
            status=status.HTTP_201_CREATED,
        ) 
    
