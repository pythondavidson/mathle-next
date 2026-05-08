// equations.js — banco central de ecuaciones de Mathle
// Edita este archivo para añadir, quitar o modificar ecuaciones.
// Todos los modos (Diario, Contrareloj, Duelo) lo importan.
//
// Campos:
//   eq         — string con la ecuación. Usa "?" para los huecos.
//   blanks     — array con los valores correctos, en orden de aparición.
//   difficulty — "fácil" | "medio" | "difícil" | "avanzado"
//   points     — puntos base en modos contrarreloj/duelo (no aplica en diario)

const EQUATIONS = [

  // ════════════════════════════════════════════════════
  //  FÁCIL — un hueco, operación directa
  // ════════════════════════════════════════════════════
  { eq: "? + 4 = 9",    blanks: [5],   difficulty: "fácil", points: 100 },
  { eq: "3 × ? = 15",   blanks: [5],   difficulty: "fácil", points: 100 },
  { eq: "? − 6 = 2",    blanks: [8],   difficulty: "fácil", points: 100 },
  { eq: "12 ÷ ? = 4",   blanks: [3],   difficulty: "fácil", points: 100 },
  { eq: "? + 8 = 13",   blanks: [5],   difficulty: "fácil", points: 100 },
  { eq: "5 × ? = 20",   blanks: [4],   difficulty: "fácil", points: 100 },
  { eq: "? − 3 = 7",    blanks: [10],  difficulty: "fácil", points: 100 },
  { eq: "18 ÷ ? = 3",   blanks: [6],   difficulty: "fácil", points: 100 },
  { eq: "? + 9 = 16",   blanks: [7],   difficulty: "fácil", points: 100 },
  { eq: "4 × ? = 28",   blanks: [7],   difficulty: "fácil", points: 100 },
  { eq: "? − 5 = 9",    blanks: [14],  difficulty: "fácil", points: 100 },
  { eq: "20 ÷ ? = 5",   blanks: [4],   difficulty: "fácil", points: 100 },
  { eq: "6 + ? = 11",   blanks: [5],   difficulty: "fácil", points: 100 },
  { eq: "? × 3 = 24",   blanks: [8],   difficulty: "fácil", points: 100 },
  { eq: "15 − ? = 6",   blanks: [9],   difficulty: "fácil", points: 100 },

  // ════════════════════════════════════════════════════
  //  MEDIO — dos huecos, requiere algo de lógica
  // ════════════════════════════════════════════════════
  { eq: "? + ? = 11",        blanks: [5, 6],  difficulty: "medio", points: 200 },
  { eq: "? × ? = 12",        blanks: [3, 4],  difficulty: "medio", points: 200 },
  { eq: "? + ? = 15",        blanks: [7, 8],  difficulty: "medio", points: 200 },
  { eq: "? × ? = 18",        blanks: [3, 6],  difficulty: "medio", points: 200 },
  { eq: "2 × ? + ? = 11",    blanks: [4, 3],  difficulty: "medio", points: 200 },
  { eq: "? × ? = 20",        blanks: [4, 5],  difficulty: "medio", points: 200 },
  { eq: "3 × ? − ? = 8",     blanks: [4, 4],  difficulty: "medio", points: 200 },
  { eq: "? + 3 × ? = 13",    blanks: [4, 3],  difficulty: "medio", points: 200 },
  { eq: "? × ? = 16",        blanks: [4, 4],  difficulty: "medio", points: 200 },
  { eq: "2 × ? − ? = 5",     blanks: [6, 7],  difficulty: "medio", points: 200 },
  { eq: "? + ? = 9",         blanks: [4, 5],  difficulty: "medio", points: 200 },
  { eq: "? × ? = 24",        blanks: [4, 6],  difficulty: "medio", points: 200 },

  // ════════════════════════════════════════════════════
  //  DIFÍCIL — potencias, paréntesis, razonamiento
  // ════════════════════════════════════════════════════
  { eq: "?^2 + ? = 12",           blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "?^2 − ? = 6",            blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "(? + 2) × ? = 15",       blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "?^2 − ?^2 = 5",          blanks: [3, 2],  difficulty: "difícil", points: 350 },
  { eq: "?^2 + 2 × ? = 8",        blanks: [2, 2],  difficulty: "difícil", points: 350 },
  { eq: "(? − 1) × (? + 1) = 8",  blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "?^2 × 2 = ? + 15",       blanks: [3, 3],  difficulty: "difícil", points: 350 },
  { eq: "?^3 = ? + 6",            blanks: [2, 2],  difficulty: "difícil", points: 350 },
  { eq: "(? + ?) × 2 = 14",       blanks: [3, 4],  difficulty: "difícil", points: 350 },
  { eq: "?^2 − 2 × ? = 3",        blanks: [3, 3],  difficulty: "difícil", points: 350 },

  // ════════════════════════════════════════════════════
  //  AVANZADO — 6 huecos, solo para el modo diario
  // ════════════════════════════════════════════════════
  { eq: "? × ? + ? = ? × ? − ?",    blanks: [3,3,1,2,5,0], difficulty: "avanzado" },
  { eq: "? + ? × ? = ? × ? − ?",    blanks: [2,3,4,2,7,0], difficulty: "avanzado" },
  { eq: "?^2 + ? + ? = ? × ? − ?",  blanks: [2,2,3,3,3,0], difficulty: "avanzado" },
  { eq: "? × ? × ? = ? + ? + ?",    blanks: [2,2,3,4,4,4], difficulty: "avanzado" },
  { eq: "? + ? × ? + ? = ? × ?",    blanks: [1,2,3,2,3,3], difficulty: "avanzado" },
  { eq: "?^2 + ? × ? = ? + ? + ?",  blanks: [3,1,2,7,3,1], difficulty: "avanzado" },
];

module.exports = EQUATIONS;
