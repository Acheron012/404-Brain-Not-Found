from rest_framework.routers import DefaultRouter
from .views import UserStateViewSet, TaskViewSet, ScheduleRequestViewSet

router = DefaultRouter()
router.register(r'user-states', UserStateViewSet, basename='userstate')
router.register(r'tasks', TaskViewSet, basename='task')
router.register(r'schedule-requests', ScheduleRequestViewSet, basename='schedulerequest')

urlpatterns = router.urls

