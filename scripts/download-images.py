from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from urllib.request import urlopen, Request
images = {
 'wedding': 'photo-1519741497674-611481863552',
 'wedding-detail': 'photo-1511795409834-ef04bbd61622',
 'couple': 'photo-1529636798458-92182e662485',
 'portrait': 'photo-1534528741775-53994a69daeb',
 'portrait-2': 'photo-1524504388940-b1c1722653e1',
 'graduation': 'photo-1627556704302-624286467c65',
 'graduation-2': 'photo-1627556704302-624286467c65',
 'birthday': 'photo-1464305795204-6f5bbfc7fb81',
 'birthday-2': 'photo-1530103862676-de8c9debad1d',
 'photographer': 'photo-1452587925148-ce544e77e70d',
}
Path('public/images').mkdir(parents=True, exist_ok=True)
def download(item):
 name, asset = item
 url = f'https://images.unsplash.com/{asset}?auto=format&fit=crop&w=1600&q=85'
 try:
  data=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0'}), timeout=45).read()
  Path(f'public/images/{name}.jpg').write_bytes(data)
  print(f'{name}: {len(data)} bytes')
 except Exception as error: print(f'FAILED {name}: {error}')
with ThreadPoolExecutor(max_workers=5) as pool: list(pool.map(download,images.items()))
