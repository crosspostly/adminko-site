import os
import re

files = [
    'about.html', 'blog.html', 'business.html', 'cctv.html', 'computers.html', 
    'consent.html', 'index.html', 'other-devices.html', 'phones.html', 
    'policy.html', 'price.html', 'services-consumer.html', 'terms.html'
]

directory = '/home/varsmana/adminko_site/site/public/'

def clean_html(content):
    # 1. Remove brand stripes with varying depths
    # Match from comment or start of div to the corresponding closing of the fixed div
    content = re.sub(r'<!-- Brand Stripes -->\s*<div class="fixed top-0 left-0 right-0 z-50">.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="fixed top-0 left-0 right-0 z-50">.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="brand-stripes w-full sticky top-0 z-\[60\]">.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="brand-stripes w-full sticky top-0 z-\[60\]">.*?</div>\s*</div>', '', content, flags=re.DOTALL)
    
    # Also catch any leftover brand-stripes divs
    content = re.sub(r'<div class="brand-stripes.*?">.*?</div>\s*</div>\s*</div>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div class="brand-stripes.*?">.*?</div>\s*</div>', '', content, flags=re.DOTALL)

    # 2. Remove header/nav/footer
    content = re.sub(r'<header.*?>.*?</header>', '', content, flags=re.DOTALL)
    content = re.sub(r'<nav.*?>.*?</nav>', '', content, flags=re.DOTALL)
    content = re.sub(r'<footer.*?>.*?</footer>', '', content, flags=re.DOTALL)
    content = re.sub(r'<div id="footer-container"></div>', '', content, flags=re.DOTALL)
    
    # 3. Remove Map sections
    sections = re.findall(r'<section.*?>.*?</section>', content, flags=re.DOTALL)
    for section in sections:
        if 'yandex.ru/map-widget' in section or 'yandex.ru/maps' in section or 'Как нас найти' in section or 'Наш адрес' in section:
            content = content.replace(section, '')
            
    # 4. Remove manual fetch and placeholders
    content = re.sub(r'<div id="header-placeholder"></div>', '', content)
    content = re.sub(r'<div id="footer-placeholder"></div>', '', content)
    content = re.sub(r'<script>\s*fetch\(\'header\.html\'\).*?</script>', '', content, flags=re.DOTALL)
    content = re.sub(r'<script>\s*fetch\(\'footer\.html\'\).*?</script>', '', content, flags=re.DOTALL)
    
    # 5. Remove messenger modal scripts
    content = re.sub(r'<script>\s*function openMessengerModal\(\).*?</script>', '', content, flags=re.DOTALL)

    # 6. Remove old components.js
    content = re.sub(r'<script src="components\.js.*?"></script>', '', content)

    # 7. Final cleanup of common leftovers
    content = re.sub(r'<!-- Header -->', '', content)
    content = re.sub(r'<!-- Map Placeholder -->', '', content)
    content = re.sub(r'<!-- CTA -->', '', content)
    content = re.sub(r'<!-- Контейнер для футера -->', '', content)
    content = re.sub(r'<!-- Brand Stripes -->', '', content)
    
    # Remove dangling </div> that might be left after header/brand stripes removal
    # This is tricky, but let's target the one right after the header-placeholder if it's there
    content = re.sub(r'(<div id="header-placeholder"></div>)\s*</div>', r'\1', content)

    # Clean up multiple newlines
    content = re.sub(r'\n{3,}', '\n\n', content)
    
    # Ensure placeholders are present
    body_match = re.search(r'(<body.*?>)', content, flags=re.IGNORECASE)
    if body_match:
        if '<div id="header-placeholder"></div>' not in content:
            content = content[:body_match.end()] + '\n\n<div id="header-placeholder"></div>' + content[body_match.end():]
    
    if '<div id="footer-placeholder"></div>' not in content:
        footer_stuff = '\n<div id="footer-placeholder"></div>\n<script src="components.js?v=3.3"></script>\n'
        content = re.sub(r'</body>', footer_stuff + '</body>', content, flags=re.IGNORECASE)
    else:
        # Placeholder is there, but maybe script is missing
        if 'components.js?v=3.3' not in content:
             content = re.sub(r'</body>', '\n<script src="components.js?v=3.3"></script>\n</body>', content, flags=re.IGNORECASE)

    return content

for filename in files:
    filepath = os.path.join(directory, filename)
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    new_content = clean_html(content)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Refined {filename}")
