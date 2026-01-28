from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from core.models import Recommendation

class Command(BaseCommand):
    help = 'Инициализирует базу данных: создает администратора и обычного пользователя'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=== Инициализация БД ==='))
        
        # 1. Создаем/обновляем админа
        admin_user, admin_created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@spokiy.app',
                'is_staff': True,
                'is_superuser': True,
            }
        )
        admin_user.set_password('admin')
        admin_user.save()
        
        if admin_created:
            self.stdout.write(self.style.SUCCESS('✓ Создан администратор'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Администратор обновлен'))
        
        self.stdout.write(f'  Username: admin')
        self.stdout.write(f'  Password: admin')
        self.stdout.write(f'  is_staff: {admin_user.is_staff}')
        self.stdout.write(f'  is_superuser: {admin_user.is_superuser}')
        
        # 2. Создаем/обновляем обычного пользователя
        regular_user, user_created = User.objects.get_or_create(
            username='testuser',
            defaults={
                'email': 'testuser@spokiy.app',
                'is_staff': False,
                'is_superuser': False,
            }
        )
        regular_user.set_password('testuser')
        regular_user.save()
        
        if user_created:
            self.stdout.write(self.style.SUCCESS('✓ Создан обычный пользователь'))
        else:
            self.stdout.write(self.style.SUCCESS('✓ Обычный пользователь обновлен'))
        
        self.stdout.write(f'  Username: testuser')
        self.stdout.write(f'  Password: testuser')
        self.stdout.write(f'  is_staff: {regular_user.is_staff}')
        
        # 3. Инициализируем рекомендации
        recommendations = [
            {'text': 'Дихання 4-7-8 - спробуй це прямо зараз!', 'sentiment_threshold': -0.5},
            {'text': 'Прогулянка на свіжому повітрі допоможе тобі', 'sentiment_threshold': -0.3},
            {'text': 'Спробуй медитацію для заспокоєння', 'sentiment_threshold': -0.4},
            {'text': 'Поговори з ким-небудь про свої почуття', 'sentiment_threshold': -0.6},
            {'text': 'Спробуй фізичні вправи - вони допоможуть', 'sentiment_threshold': -0.2},
        ]
        
        created_count = 0
        for rec_data in recommendations:
            rec, created = Recommendation.objects.get_or_create(
                text=rec_data['text'],
                defaults={'sentiment_threshold': rec_data['sentiment_threshold']}
            )
            if created:
                created_count += 1
        
        self.stdout.write(self.style.SUCCESS(f'✓ Инициализировано {created_count} рекомендаций'))
        
        # Итоги
        self.stdout.write(self.style.SUCCESS('\n=== Инициализация завершена успешно! ==='))
        self.stdout.write(self.style.WARNING('\nДля входа используй:'))
        self.stdout.write('  Администратор: admin / admin')
        self.stdout.write('  Обычный пользователь: testuser / testuser')
