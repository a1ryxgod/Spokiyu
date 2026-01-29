from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token
from core.views import (
    MoodRecordViewSet, 
    RegisterView,
    AdminUserViewSet,
    AdminRecommendationViewSet,
    AdminSentimentWordViewSet
)

# Основной роутер
router = DefaultRouter()
router.register(r'mood-records', MoodRecordViewSet, basename='moodrecord')

# Админский роутер
admin_router = DefaultRouter()
admin_router.register(r'users', AdminUserViewSet, basename='admin-users')
admin_router.register(r'recommendations', AdminRecommendationViewSet, basename='admin-recommendations')
admin_router.register(r'sentiment-words', AdminSentimentWordViewSet, basename='admin-sentiment-words')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api/admin/', include(admin_router.urls)),
    
    # Auth endpoints
    path('api/register/', RegisterView.as_view(), name='register'),
    path('api/login/', obtain_auth_token, name='login'),
]