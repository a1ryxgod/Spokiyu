from rest_framework import serializers
from .models import MoodRecord, Recommendation, SentimentWord
from django.contrib.auth.models import User

class MoodRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = MoodRecord
        fields = ['id', 'text', 'mood_level', 'sentiment_score', 'date']
        # ВАЖЛИВО: 'date' більше не в read_only_fields!
        read_only_fields = ['sentiment_score'] 

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'is_staff', 'is_active')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class SentimentWordSerializer(serializers.ModelSerializer):
    class Meta:
        model = SentimentWord
        fields = '__all__'

class RecommendationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Recommendation
        fields = '__all__'