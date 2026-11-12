# Ícones do Navalha.app
34 imagens fornecidas pelo Douglas, organizadas em sete categorias no catálogo `catalogo.json`.
- `index.html`: referência visual responsiva, com tamanho ajustável e fundo claro/escuro.
- Pastas de categoria: PNGs transparentes, 192 × 192, usados pelo sistema.
- `originais/<categoria>`: arquivos fornecidos, preservados sem alterações. São PNGs, não vetores.
- `node scripts/optimize-icons.mjs`: reconstrói as versões de tela usando Sharp, já instalado.
O processamento remove somente o fundo quase branco conectado à borda, recorta e centraliza com margem de 8 px. Detalhes brancos internos são preservados.
Para trocar um desenho, substitua seu original e rode o comando. Mantenha o id e o caminho para preservar as referências. Confira sempre os fundos claro e escuro.
Ícones de ação genéricos (excluir, fechar, setas e carregamento) continuam vetoriais Lucide; logos e fotos não fazem parte deste catálogo.
Os PNGs legados de ilustração foram removidos das duas localizações anteriores. O histórico Git é preservado.
