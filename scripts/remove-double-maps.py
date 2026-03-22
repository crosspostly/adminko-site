import os
import re

blog_dir = 'site/public/blog'
files = [f for f in os.listdir(blog_dir) if f.endswith('.html')]

# Ищем блок карты: от <!-- Карта --> до </section>
map_pattern = re.compile(r'<!-- Карта -->[\s\S]*?</section>', re.IGNORECASE)

print(f"🚀 Удаление дубликатов карт в {len(files)} файлах...")

for filename in files:
    filepath = os.path.join(blog_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Считаем количество карт
    maps_found = len(map_pattern.findall(content))
    
    if maps_found > 1:
        # Удаляем ПЕРВОЕ вхождение карты (оно обычно внутри статьи)
        # Оставляем последнее (оно в футере)
        new_content = map_pattern.sub('', content, count=1)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        # print(f"✅ Исправлен: {filename}")

print("✨ Все дубликаты карт удалены. В каждой статье теперь только одна карта в футере.")
