import os
import re

blog_dir = 'site/public/blog'
files = [f for f in os.listdir(blog_dir) if f.endswith('.html')]

print(f"🚀 Запуск ПЕРЕВЕРСТКИ абзацев в {len(files)} файлах...")

for filename in files:
    filepath = os.path.join(blog_dir, filename)
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Извлекаем контент между CONTENT START и END
    match = re.search(r'(<!-- CONTENT START -->)([\s\S]*?)(<!-- CONTENT END -->)', content)
    if not match: continue
    
    start, inner, end = match.groups()
    
    # 1. Сначала убираем старые корявые <p> если они есть
    inner = re.sub(r'</p><p[^>]*>', '\n\n', inner)
    inner = inner.replace('<p>', '').replace('</p>', '')
    
    # 2. Очищаем маркдаун если остался
    inner = re.sub(r'\*\*([\s\S]*?)\*\*', r'<strong>\1</strong>', inner)
    inner = re.sub(r'^### (.*$)', r'<h3 class="text-xl font-bold mt-8 mb-4 text-gray-900 dark:text-white">\1</h3>', inner, flags=re.MULTILINE)
    inner = re.sub(r'^## (.*$)', r'<h2 class="text-2xl font-black mt-10 mb-6 text-gray-900 dark:text-white uppercase tracking-tighter italic border-l-4 border-primary pl-4">\1</h2>', inner, flags=re.MULTILINE)
    
    # 3. Разбиваем на блоки по двойному переносу
    blocks = re.split(r'\n\s*\n', inner)
    new_inner = []
    
    for block in blocks:
        block = block.strip()
        if not block: continue
        # Если блок уже является тегом (h2, h3, li, div) - не трогаем
        if block.startswith('<h') or block.startswith('<li') or block.startswith('<div'):
            new_inner.append(block)
        else:
            new_inner.append(f'<p class="mb-6 leading-relaxed text-gray-700 dark:text-gray-300 font-medium text-lg">{block}</p>')
            
    final_inner = "\n\n".join(new_inner)
    new_content = content[:match.start(2)] + final_inner + content[match.end(2):]

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)

print("✅ Все статьи переверстаны. Полотно текста устранено.")
