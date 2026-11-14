/* =====================================================================
   CodeRealm — itens de aparência do personagem
   price = moedas · req = id da fase que libera o item de graça.
   Para um item novo aparecer no boneco, ele também precisa ser desenhado
   em makeCharacter (src/engine/world.js).
   ===================================================================== */

// Itens de aparência. price 0 = grátis. req = só libera ao concluir aquela fase.
const COSMETICS = {
  hairStyle: [
    { id: 'curto', name: 'Curto', price: 0 },
    { id: 'longo', name: 'Longo', price: 0 },
    { id: 'careca', name: 'Careca', price: 0 },
    { id: 'espetado', name: 'Espetado', price: 40 },
    { id: 'coque', name: 'Coque', price: 40 },
  ],
  hat: [
    { id: 'nenhum', name: 'Nenhum', price: 0 },
    { id: 'bone', name: 'Boné', price: 60 },
    { id: 'fones', name: 'Fones de dev', price: 90 },
    { id: 'mago', name: 'Chapéu de mago', price: 150 },
    { id: 'coroa', name: 'Coroa do Orquestrador', price: 0, req: 'orquestra' },
  ],
  cape: [
    { id: 'nenhuma', name: 'Nenhuma', price: 0 },
    { id: 'capa', name: 'Capa de aventureiro', price: 120 },
  ],
  pet: [
    { id: 'nenhum', name: 'Nenhum', price: 0 },
    { id: 'slime', name: 'Slime Bug', price: 150 },
    { id: 'drone', name: 'Drone de Deploy', price: 220 },
    { id: 'coruja', name: 'Coruja Lin Jr.', price: 300 },
  ],
};
const COSMETIC_LABELS = { hairStyle: 'Cabelo', hat: 'Chapéu', cape: 'Capa', pet: 'Mascote' };
const PALETTES = {
  skin: ['#fde3cf', '#f4d1b5', '#e0ac69', '#c68642', '#8d5524', '#5c3a1e'],
  hair: ['#3b2a1a', '#1a1626', '#8a5a1a', '#d9a441', '#c0392b', '#d8d8e0', '#8b5cf6', '#2496ed'],
  outfit: ['#8b5cf6', '#2496ed', '#1f9d55', '#e05a5a', '#ff8a3d', '#2d2545', '#e8e3d9', '#d6479c'],
  scarf: ['#f5c542', '#ffffff', '#e05a5a', '#4ade80', '#2496ed', '#8b5cf6', '#ff8a3d', '#1a1626'],
};
const PALETTE_LABELS = { skin: 'Pele', hair: 'Cor do cabelo', outfit: 'Roupa', scarf: 'Cachecol e capa' };
