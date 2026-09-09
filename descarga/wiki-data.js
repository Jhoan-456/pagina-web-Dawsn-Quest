// ---- Datos de la Wiki ----
// Para agregar una entrada nueva, copiá uno de estos objetos y completalo.
// category tiene que ser una de: "enemigos", "armas", "objetos", "salas"
// stats es opcional: una lista de {label, value} que se muestra como tabla.

const WIKI_DATA = [
  {
    id: "Esfera-Maligna",
    category: "enemigos",
    name: "Esfera Maligna",
    summary: "Primer Enemigo que te encuentrar en tu primera partida",
    stats: [
      { label: "Tipo", value: "Rango / Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value : "Bosque"},
      { label: "Vida", value: "35.0" }
    ],
    description: "Es un enemigo comun pero no te dejes engañar, cuando llega a la mitad de vida se duplica en 2 mini esferas malignas, y envez de generar 8 proyectiles, ahora solo genera 5 cada Esfera Mini"
  },
  {
    id: "Esferas-Minis",
    category: "enemigos",
    name: "Esferas Malignas Minis",
    summary: "Estan cuando a la Esfera Maligna la dejas a mitad de vida y se divide en 2 minis Esferas ",
    stats: [
      { label: "Tipo", value: "Rango / Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value : "Bosque"},
      { label: "Vida", value: "8.75" }
    ],
    description: "Es hijo de la Esfera Maligan, esta aqui para vengar la muestre de su padre"
  },
  {
    id: "Slime",
    category: "enemigos",
    name: "Slime",
    summary: "Es tu Segundo Enemigo que te encuentrar en tus primeras partidas",
    stats: [
      { label: "Tipo", value: "Mele" },
      { label: "Comportamiento", value: "Persigue al jugador en línea recta" },
      { label: "Bioma Respectivo", value : "Bosque"},
      { label: "Vida", value: "15.0" }
    ],
    description: "Es lento pero peligroso"
  },
  {
    id: "bulbo-Plantera",
    category: "jefes",
    name: "Plantera",
    summary: "Es el primer Jefe del bioma",
    stats: [
      { label: "Tipo", value: "Rango" },
      { label: "Comportamiento", value: "Dispara Proyectiles a todas las direcciones" },
      { label: "Bioma Respectivo", value : "Bosque"},
      { label: "Vida", value: "500.0" },
      { label: "Cantidad de Fases", value: "3" },
    ],
    description: "Plantera Odia que le digas Bulbo, pero toco decirle asi :)"
  },
  {
    id: "personaje-byte",
    category: "personaje",
    name: "Byte",
    summary: "Es un nuevo personaje agregado al juego que utiliza atributos que cambian las caracheristicas base de las armas",
    stats: [
      { label: "Vida", value: "160.0" },
      { label: "Escudo", value: "150.0" },
      { label: "Energia", value: "400.0" },
      { label: "Fuerza", value: "5" },
      { label: "Inteligencia", value: "9" },
      { label: "Velocidad de Ataque", value: "6.5" },
      { label: "Velocidad de Proyectil", value: "14.0" },
      { label: "Velocidad de Movimiento", value: "10.0" },
      { label: "Probabilidad de Critico", value: "1.5" },
      { label: "Suerte", value: "1.2" },
      { label: "Activo", value: "Ítem inicial: Bateria Portatil (Al usarla recarga instantáneamente la pasiva y da un pequeño escudo)" },
      { label: "Pasivo", value: "SobreCarga (Cada 8s su proximo disparo no fisico hacen un 30% mas de daño y deja un pequeño rastro eléctrico)" },
    ],
    description: "Es un poco timido pero le coges cariño como a mi y a los otros desarrolladores"
  },
  {
    id: "arma-default",
    category: "armas",
    name: "Arma Default",
    summary: "Arma inicial del personaje Default",
    stats: [
      { label: "Costo de Energia", value: "1.0" },
      { label: "Tipo de Clase", value: "Rango" },
      { label: "Atributos", value: "Depende del Personaje que lo tenga Equipado" }
    ],
    description: "Esta arma fue traida al mundo y desde estonces le gusto al creador, tiene un daño, cadencia y velocidad increible que pesar que solo los desarrolladores lo utilizan para pruebas"
  },
  {
    id: "baculo",
    category: "armas",
    name: "Báculo",
    summary: "Primera Arma de la Clase Mago y primera en utilizar estadisticas que suman los atributos del personaje que lo tiene equipado",
    stats: [
      { label: "Costo de Energia", value: "5.0" },
      { label: "Tipo de Clase", value: "Mago" },
      { label: "Daño base", value: "3.0" },
      { label: "Escalado de Inteligencia", value: "0.68" },
      { label: "Escalado de Fuerza", value: "0.0" },
      { label: "Cadencia Base", value: "0.7" },
      { label: "Multiplicador de Velocidad del Proyectil", value: "1.0" },
      { label: "Extra", value: "Aplica Quemadura durante 2s" },
    ],
    description: "Si quieres ser violento y quiere ser tryhard esta arma para empezar es muy buena aunque estaprimera version la siento desvalanciada "
  },
  {
    id: "moneda",
    category: "objetos",
    name: "Moneda",
    summary: "La moneda del juego. La sueltan los enemigos al morir.",
    stats: [
      { label: "Se obtiene", value: "Derrotando enemigos (50%)" },
      { label: "Se muestra en", value: "Cualquier Sala" }
    ],
    description: "Cada Enemigo derrotado te dara una probabilidad del 50 % de que te den una moneda"
  },
  {
    id: "bosque",
    category: "mapa-bioma",
    name: "El bosque",
    summary: "El escenario principal: donde inicias tus primeras partidas y aprendes con el tutorial",
    stats: [
      { label: "Cantidad de Capitulos", value: "5" },
      { label: "Cantidad de Episodios", value: "5" }
    ],
    description: "Este nivel te va a llenar de emociones el primer segundo que lo juegas....disfrutalo de verdad"
  }
];

const WIKI_CATEGORIES = [
  { id: "todos", label: "Todos" },
  { id: "enemigos", label: "Enemigos" },
  { id: "jefes", label: "Jefes"},
  { id: "personaje", label: "Personajes" },
  { id: "armas", label: "Armas" },
  { id: "objetos", label: "Objetos" },
  { id: "mapa-bioma", label: "Bioma" }
];
