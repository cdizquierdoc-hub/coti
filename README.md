# COTI · Comparador de Ofertas y Tarifas Inteligente

Compara precios de contado y a crédito de Crecos, Orve Hogar y Almacenes Japón frente a la competencia, con fotos, "mismo modelo" y una rueda de más vendidos.

- **Página:** https://cdizquierdoc-hub.github.io/coti/
- **Más vendidos de una tienda:** agrega `#mas-vendidos-<tienda>` al link (ej. `#mas-vendidos-marcimex`).
- **Escaneo:** `escaner/escanear.py` corre cada hora en GitHub Actions (`.github/workflows/escaneo.yml`) y guarda un JSON por tienda en la rama `data`, carpeta `precios/`.
