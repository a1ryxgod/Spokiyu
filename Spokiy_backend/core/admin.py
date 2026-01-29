from django.contrib import admin

# Register your models here.
from django.contrib import admin
from .models import MoodRecord, Recommendation

# Настройка отображения MoodRecord в админке
@admin.register(MoodRecord)
class MoodRecordAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'mood_level', 'sentiment_score', 'date', 'text_preview']
    list_filter = ['mood_level', 'date', 'user']
    search_fields = ['text', 'user__username']
    readonly_fields = ['sentiment_score', 'date']
    ordering = ['-date']
    
    # Показываем первые 50 символов текста
    def text_preview(self, obj):
        return obj.text[:50] + '...' if len(obj.text) > 50 else obj.text
    text_preview.short_description = 'Текст'

# Настройка отображения Recommendation в админке
@admin.register(Recommendation)
class RecommendationAdmin(admin.ModelAdmin):
    list_display = ['id', 'sentiment_threshold', 'text_preview']
    list_filter = ['sentiment_threshold']
    search_fields = ['text']
    ordering = ['sentiment_threshold']
    
    # Показываем первые 100 символов рекомендации
    def text_preview(self, obj):
        return obj.text[:100] + '...' if len(obj.text) > 100 else obj.text
    text_preview.short_description = 'Рекомендація'