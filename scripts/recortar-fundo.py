# Recorta o fundo de uma foto de pessoa (a do Mateus) com o modelo isnet-general-use + matting.
# Roda DENTRO de um container Docker, para não instalar nada no PC:
#
#   docker run --rm -m 2500m -v "<pasta com mateus.jpeg>:/work" python:3.12-slim \
#     sh -c "pip install -q --no-cache-dir 'rembg[cpu]' pillow && python /work/recortar-fundo.py"
#
# Saída: /work/corte-isnet-general-use-matting.png (RGBA). Depois: node scripts/gerar-hero-america.mjs (apaga restos, embute o brilho).
# Modelos testados em 01/11/2026: u2net_human_seg manteve o reflexo do espelho como se fosse pessoa e apagou as lâminas da tesoura;
# isnet-general-use resolveu os dois; com matting as bordas e o cabelo ficam mais suaves.
from rembg import remove, new_session
from PIL import Image

im = Image.open('/work/mateus.jpeg').convert('RGB')
s = new_session('isnet-general-use')
out = remove(
    im,
    session=s,
    alpha_matting=True,
    alpha_matting_foreground_threshold=240,
    alpha_matting_background_threshold=15,
    alpha_matting_erode_size=8,
)
out.save('/work/corte-isnet-general-use-matting.png')
print('ok', out.size)
