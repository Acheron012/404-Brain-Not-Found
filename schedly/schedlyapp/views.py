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
        
        print("TYPE:", type(schedule_request))
        print("DATA:", schedule_request)
        #print("RESULT:", result)
        
        # call the pipeline
        result = run_planning_pipeline(schedule_request=schedule_request)
        
        # store final decision
        PlanDecision.objects.create(
            schedule_request=schedule_request,
            selected_plan = result['selected_plan'],
            score = result['score'],
            metrics = result['metrics']
        )
        
        return Response(
            {
            "schedule_request": ScheduleRequestSerializer(schedule_request).data,
            "best_plan": result
            },
            status=status.HTTP_201_CREATED
        ) 
    
