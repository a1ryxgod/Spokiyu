from rest_framework import viewsets, generics, permissions
from rest_framework.permissions import IsAdminUser
from .models import MoodRecord, Recommendation, SentimentWord
from .serializers import MoodRecordSerializer, UserSerializer, RecommendationSerializer, SentimentWordSerializer
from django.contrib.auth.models import User

# 1. Реєстрація нового користувача
class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (permissions.AllowAny,) # Дозволяємо всім (навіть анонімам) реєструватися
    serializer_class = UserSerializer

# 2. Робота з записами (Тільки для своїх)
class MoodRecordViewSet(viewsets.ModelViewSet):
    serializer_class = MoodRecordSerializer
    permission_classes = [permissions.IsAuthenticated] # <--- ЗАХИСТ: Тільки для тих, хто увійшов

    # Показуємо тільки записи поточного користувача
    def get_queryset(self):
        return MoodRecord.objects.filter(user=self.request.user).order_by('-date')

    # При створенні запису автоматично прив'язуємо його до користувача
    def perform_create(self, serializer):
        serializer.save(user=self.request.user) # <--- Самі підставляємо user_id

    # (Тут твоя стара логіка з рекомендаціями)
    def create(self, request, *args, **kwargs):
        response = super().create(request, *args, **kwargs)
        sentiment = response.data.get('sentiment_score', 0)
        rec = Recommendation.objects.filter(sentiment_threshold__gte=sentiment).order_by('sentiment_threshold').first()
        if rec:
            response.data['recommendation'] = rec.text
        else:
            response.data['recommendation'] = "Раді, що у вас гарний настрій!"
        return response


# 3. АДМИНКА: Управління користувачами (тільки для адмінів)
class AdminUserViewSet(viewsets.ModelViewSet):
    """ViewSet для управління користувачами (тільки для адмінів)"""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [IsAdminUser]  # Тільки адміни (is_staff=True)


# 4. АДМИНКА: Управління рекомендаціями (тільки для адмінів)
class AdminRecommendationViewSet(viewsets.ModelViewSet):
    """ViewSet для управління рекомендаціями (тільки для адмінів)"""
    queryset = Recommendation.objects.all()
    serializer_class = RecommendationSerializer
    permission_classes = [IsAdminUser]  # Тільки адміни (is_staff=True)

# 5. АДМИНКА: Управління словником тональності
class AdminSentimentWordViewSet(viewsets.ModelViewSet):
    """ViewSet для управління словником тональності (тільки для адмінів)"""
    queryset = SentimentWord.objects.all()
    serializer_class = SentimentWordSerializer
    permission_classes = [IsAdminUser]