from django.db import models
from django.contrib.auth.models import User
from textblob import TextBlob
from django.utils import timezone
from deep_translator import GoogleTranslator # <--- Нова бібліотека

# --- Таблиця Рекомендацій ---
class Recommendation(models.Model):
    text = models.TextField(verbose_name="Текст поради")
    sentiment_threshold = models.FloatField(default=0.0, verbose_name="Поріг (від -1.0)")

    def __str__(self):
        return self.text[:50]

# --- Таблиця Сеансів (Терапія) ---
class TherapySession(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Очікує підтвердження'),
        ('confirmed', 'Підтверджено'),
        ('completed', 'Завершено'),
        ('canceled', 'Скасовано'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE)
    date_time = models.DateTimeField(verbose_name="Дата та час сеансу")
    notes = models.TextField(verbose_name="Коментар користувача", blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Сеанс {self.user.username} на {self.date_time}"

# --- Таблиця слів для аналізу тональності ---
class SentimentWord(models.Model):
    word = models.CharField(max_length=100, unique=True, verbose_name="Слово або фраза")
    score = models.FloatField(verbose_name="Вага (-1.0 до 1.0)")

    def __str__(self):
        return f"{self.word} ({self.score})"

# --- Таблиця Записів Настрою (З NLP) ---
class MoodRecord(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True)
    date = models.DateTimeField(default=timezone.now)
    text = models.TextField(verbose_name="Опис емоцій")
    sentiment_score = models.FloatField(default=0.0, verbose_name="Тональність")
    mood_level = models.IntegerField(default=5, verbose_name="Рівень настрою")

    def save(self, *args, **kwargs):
        # 1. Спробуємо перекласти текст на англійську для точного аналізу
        try:
            # Використовуємо Google Translate (auto -> english)
            translated_text = GoogleTranslator(source='auto', target='en').translate(self.text)
            print(f"Original: {self.text} -> Translated: {translated_text}") # Для налагодження в консолі
            
            # 2. Аналізуємо перекладений текст
            blob = TextBlob(translated_text)
        except Exception as e:
            print(f"Translation Error: {e}")
            # Якщо переклад не вдався (немає інтернету), аналізуємо як є
            blob = TextBlob(self.text)

        # 3. Зберігаємо результат (-1.0 ... +1.0)
        self.sentiment_score = blob.sentiment.polarity
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.date.strftime('%Y-%m-%d %H:%M')} (Score: {self.sentiment_score})"