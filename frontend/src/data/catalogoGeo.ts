export interface EntidadGeografica {
  nu_geografico: number;
  nb_geografico: string;
  municipios: MunicipioGeografico[];
}

export interface MunicipioGeografico {
  nu_geografico: number;
  nb_geografico: string;
  parroquias?: string[];
}

export const ESTADOS_VENEZUELA: EntidadGeografica[] = [
  {
    nu_geografico: 1490,
    nb_geografico: "EDO. LA GUAIRA",
    municipios: [
      {
        nu_geografico: 1491,
        nb_geografico: "MP. VARGAS",
        parroquias: [
          "LA GUAIRA",
          "MAIQUETÍA",
          "MACUTO",
          "CARABALLEDA",
          "CATIA LA MAR",
          "NAIGUATÁ",
          "CARAYACA",
          "CARUAO",
          "CARLOS SOUBLETTE",
          "EL JUNKO",
          "URIMARE"
        ]
      }
    ]
  },
  {
    nu_geografico: 2,
    nb_geografico: "DTTO. CAPITAL",
    municipios: [
      {
        nu_geografico: 3,
        nb_geografico: "MP. LIBERTADOR",
        parroquias: [
          "CATEDRAL",
          "ALTAGRACIA",
          "SANTA TERESA",
          "SANTA ROSALÍA",
          "SAN JUAN",
          "LA PASTORA",
          "SAN JOSÉ",
          "SAN BERNARDINO",
          "SUCRE (CATIA)",
          "23 DE ENERO",
          "ANTÍMANO",
          "EL VALLE",
          "CARICUAO",
          "EL RECREO",
          "SAN AGUSTÍN",
          "SAN PEDRO",
          "COCHE",
          "LA VEGA",
          "MACARAO",
          "EL PARAÍSO"
        ]
      }
    ]
  },
  {
    nu_geografico: 752,
    nb_geografico: "EDO. MIRANDA",
    municipios: [
      { nu_geografico: 753, nb_geografico: "MP. GUAICAIPURO", parroquias: ["LOS TEQUES", "SAN PEDRO", "ALTAGRACIA DE LA MONTAÑA", "CECILIO ACOSTA", "PARACOTOS"] },
      { nu_geografico: 754, nb_geografico: "MP. SUCRE", parroquias: ["PETARE", "LEONCIO MARTÍNEZ", "CAUCAGÜITA", "FILAS DE MARICHE", "LA DOLORITA"] },
      { nu_geografico: 755, nb_geografico: "MP. BARUTA", parroquias: ["BARUTA", "EL CAFETAL", "LAS MINAS DE BARUTA"] },
      { nu_geografico: 756, nb_geografico: "MP. CHACAO", parroquias: ["CHACAO"] },
      { nu_geografico: 757, nb_geografico: "MP. EL HATILLO", parroquias: ["EL HATILLO"] },
      { nu_geografico: 758, nb_geografico: "MP. PLAZA", parroquias: ["GUARENAS"] },
      { nu_geografico: 759, nb_geografico: "MP. ZAMORA", parroquias: ["GUATIRE", "BOLÍVAR"] },
      { nu_geografico: 760, nb_geografico: "MP. CRISTÓBAL ROJAS", parroquias: ["CHARALLAVE", "LAS BRISAS"] },
      { nu_geografico: 761, nb_geografico: "MP. INDEPENDENCIA", parroquias: ["SANTA TERESA DEL TUY", "EL CARTANAL"] },
      { nu_geografico: 762, nb_geografico: "MP. LANDER", parroquias: ["OCUMARE DEL TUY", "SANTA BÁRBARA", "LA DEMOCRACIA"] },
      { nu_geografico: 763, nb_geografico: "MP. PAZ CASTILLO", parroquias: ["SANTA LUCÍA"] },
      { nu_geografico: 764, nb_geografico: "MP. SIMÓN BOLÍVAR", parroquias: ["SAN FRANCISCO DE YARE", "SAN ANTONIO DE YARE"] },
      { nu_geografico: 765, nb_geografico: "MP. URDANETA", parroquias: ["CÚA", "NUEVA CÚA"] },
      { nu_geografico: 766, nb_geografico: "MP. LOS SALIAS", parroquias: ["SAN ANTONIO DE LOS ALTOS"] },
      { nu_geografico: 767, nb_geografico: "MP. CARRIZAL", parroquias: ["CARRIZAL"] },
      { nu_geografico: 768, nb_geografico: "MP. BRIÓN", parroquias: ["HIGUEROTE", "CURIEPE", "TACARIGUA"] },
      { nu_geografico: 769, nb_geografico: "MP. BURÓZ", parroquias: ["MAMPORAL"] },
      { nu_geografico: 770, nb_geografico: "MP. ANDRÉS BELLO", parroquias: ["SAN JOSÉ DE BARLOVENTO", "CUMBO"] },
      { nu_geografico: 771, nb_geografico: "MP. PÁEZ", parroquias: ["RÍO CHICO", "EL GUAPO", "TACARIGUA DE LA LAGUNA", "PAPARO"] },
      { nu_geografico: 772, nb_geografico: "MP. PEDRO GUAL", parroquias: ["CÚPIRA", "MACHURUCUTO"] },
      { nu_geografico: 773, nb_geografico: "MP. ACEVEDO", parroquias: ["CAUCAGUA", "ARAGÜITA", "AREVALO APONTE", "CAPAYA", "EL CAFÉ", "MARIZAPA", "PANAQUIRE", "RIBAS"] }
    ]
  },
  {
    nu_geografico: 332,
    nb_geografico: "EDO. CARABOBO",
    municipios: [
      { nu_geografico: 333, nb_geografico: "MP. VALENCIA", parroquias: ["SAN JOSÉ", "SAN BLAS", "CANDELARIA", "CATEDRAL", "EL SOCORRO", "MIGUEL PEÑA", "RAFAEL URDANETA", "SANTA ROSA", "NEGRO PRIMERO"] },
      { nu_geografico: 334, nb_geografico: "MP. PUERTO CABELLO", parroquias: ["BARTOLOMÉ SALOM", "DEMOCRACIA", "FRATERNIDAD", "GOAIGOAZA", "JUAN JOSÉ FLORES", "UNIÓN", "BORBURATA", "PATANEMO"] },
      { nu_geografico: 335, nb_geografico: "MP. GUACARA", parroquias: ["GUACARA", "CIUDAD ALIANZA", "YAGUA"] },
      { nu_geografico: 336, nb_geografico: "MP. NAGUANAGUA", parroquias: ["NAGUANAGUA"] },
      { nu_geografico: 337, nb_geografico: "MP. SAN DIEGO", parroquias: ["SAN DIEGO"] },
      { nu_geografico: 338, nb_geografico: "MP. LOS GUAYOS", parroquias: ["LOS GUAYOS"] },
      { nu_geografico: 339, nb_geografico: "MP. LIBERTADOR", parroquias: ["TOCUYITO", "INDEPENDENCIA"] }
    ]
  },
  {
    nu_geografico: 137,
    nb_geografico: "EDO. ARAGUA",
    municipios: [
      { nu_geografico: 138, nb_geografico: "MP. GIRARDOT", parroquias: ["LOS TACARIGUAS", "ANDRÉS ELOY BLANCO", "CASANOVA GODOY", "CHORONÍ", "JOAQUÍN CRESPO", "MADRE MARÍA DE SAN JOSÉ", "PEDRO JOSÉ OVALLES", "JOSÉ CASANOVA GODOY"] },
      { nu_geografico: 139, nb_geografico: "MP. SANTIAGO MARIÑO", parroquias: ["TURMERO", "CHUAO", "ALFREDO PACHECO MIRANDA", "SAMÁN DE GÜERE"] },
      { nu_geografico: 140, nb_geografico: "MP. JOSÉ FÉLIX RIBAS", parroquias: ["LA VICTORIA", "CASTOR NIEVES RÍOS", "LAS GUACAMAYAS", "PAO DE ZÁRATE", "ZUATA"] }
    ]
  },
  {
    nu_geografico: 1296,
    nb_geografico: "EDO. ZULIA",
    municipios: [
      { nu_geografico: 1297, nb_geografico: "MP. MARACAIBO", parroquias: ["BOLÍVAR", "CACIQUE MARA", "CARACCIOLO PARRA PÉREZ", "CECILIO ACOSTA", "CRISTO DE ARANZA", "COQUIVACOA", "CHIQUINQUIRÁ", "FRANCISCO EUGENIO BUSTAMANTE", "IDELFONSO VÁSQUEZ", "JUANA DE ÁVILA", "LUIS HURTADO HIGUERA", "MANUEL DAGNINO", "OLEGARIO VILLALOBOS", "RAÚL LEONI", "SAN ISIDRO", "SANTA LUCÍA", "VENANCIO PULGAR"] },
      { nu_geografico: 1298, nb_geografico: "MP. SAN FRANCISCO", parroquias: ["SAN FRANCISCO", "EL BAJO", "DOMITILA FLORES", "FRANCISCO OCHOA", "LOS CORTIJOS", "MARCIAL HERNÁNDEZ", "JOSÉ DOMINGO RUS"] },
      { nu_geografico: 1299, nb_geografico: "MP. CABIMAS", parroquias: ["AMBROSIO", "CARMEN HERRERA", "LA ROSA", "PUNTA GORDA", "JORGE HERNÁNDEZ", "RÓMULO BETANCOURT", "SAN BENITO"] }
    ]
  },
  {
    nu_geografico: 574,
    nb_geografico: "EDO. LARA",
    municipios: [
      { nu_geografico: 575, nb_geografico: "MP. IRIBARREN", parroquias: ["CATEDRAL", "CONCEPCIÓN", "SANTA ROSA", "UNIÓN", "EL CUJÍ", "TAMACA", "JUAN DE VILLEGAS", "AGUEDO FELIPE ALVARADO", "BUENA VISTA", "JUÁREZ"] },
      { nu_geografico: 576, nb_geografico: "MP. PALAVECINO", parroquias: ["CABUDARE", "JOSÉ GREGORIO BASTIDAS", "AGUA VIVA"] }
    ]
  },
  {
    nu_geografico: 26,
    nb_geografico: "EDO. ANZOATEGUI",
    municipios: [
      { nu_geografico: 27, nb_geografico: "MP. SIMÓN BOLÍVAR", parroquias: ["EL CARMEN", "SAN CRISTÓBAL", "BERGANTÍN", "CAICARA DE BARCELONA", "EL PILAR", "NARICUAL"] },
      { nu_geografico: 28, nb_geografico: "MP. JUAN ANTONIO SOTILLO", parroquias: ["PUERTO LA CRUZ", "POZUELOS"] },
      { nu_geografico: 29, nb_geografico: "MP. SIMÓN RODRÍGUEZ", parroquias: ["EDMUNDO PINTO SALINAS", "MIGUEL OTERO SILVA"] }
    ]
  },
  {
    nu_geografico: 1050,
    nb_geografico: "EDO. TACHIRA",
    municipios: [
      { nu_geografico: 1051, nb_geografico: "MP. SAN CRISTÓBAL", parroquias: ["LA CONCORDIA", "SAN JUAN BAUTISTA", "PEDRO MARÍA MORANTES", "SAN SEBASTIÁN", "DR. FRANCISCO ROMERO LOBO"] },
      { nu_geografico: 1052, nb_geografico: "MP. CÁRDENAS", parroquias: ["TÁRIBA", "AMENODORO RANGEL LAMUS", "LA FLORIDA"] }
    ]
  },
  { nu_geografico: 1, nb_geografico: "EDO. AMAZONAS", municipios: [{ nu_geografico: 11, nb_geografico: "MP. ATURES", parroquias: ["FERNANDO GIRÓN TOVAR", "LUIS ALBERTO GÓMEZ", "PARHUEÑA", "PLATANILLAL"] }] },
  { nu_geografico: 70, nb_geografico: "EDO. APURE", municipios: [{ nu_geografico: 71, nb_geografico: "MP. SAN FERNANDO", parroquias: ["SAN FERNANDO", "EL RECREO", "PEÑALVER", "SAN RAFAEL DE ATAMAICA"] }] },
  { nu_geografico: 200, nb_geografico: "EDO. BARINAS", municipios: [{ nu_geografico: 201, nb_geografico: "MP. BARINAS", parroquias: ["BARINAS", "ALTO BARINAS", "RAMÓN IGNACIO MÉNDEZ", "RÓMULO BETANCOURT"] }] },
  { nu_geografico: 260, nb_geografico: "EDO. BOLÍVAR", municipios: [{ nu_geografico: 261, nb_geografico: "MP. CARONÍ", parroquias: ["SIMÓN BOLÍVAR", "UNIÓN", "CHIRICA", "DALLA COSTA", "UNIVERSIDAD", "UNARE"] }, { nu_geografico: 262, nb_geografico: "MP. ANGOSTURA DEL ORINOCO", parroquias: ["CATEDRAL", "AGUA SALADA", "LA SABANITA", "VISTA HERMOSA"] }] },
  { nu_geografico: 400, nb_geografico: "EDO. COJEDES", municipios: [{ nu_geografico: 401, nb_geografico: "MP. EZEQUIEL ZAMORA", parroquias: ["SAN CARLOS DE AUSTRIA", "JUAN ÁNGEL BRAVO", "MANUEL MANRIQUE"] }] },
  { nu_geografico: 440, nb_geografico: "EDO. DELTA AMACURO", municipios: [{ nu_geografico: 441, nb_geografico: "MP. TUCUPITA", parroquias: ["SAN JOSÉ", "VIRGEN DEL VALLE", "SAN RAFAEL", "JOSÉ VIDAL MARCANO"] }] },
  { nu_geografico: 470, nb_geografico: "EDO. FALCÓN", municipios: [{ nu_geografico: 471, nb_geografico: "MP. MIRANDA", parroquias: ["SANTA ANA", "SAN GABRIEL", "SAN ANTONIO"] }, { nu_geografico: 472, nb_geografico: "MP. CARIRUBANA", parroquias: ["CARIRUBANA", "NORTE", "PUNTA CARDÓN", "SANTA ANA"] }] },
  { nu_geografico: 520, nb_geografico: "EDO. GUÁRICO", municipios: [{ nu_geografico: 521, nb_geografico: "MP. JUAN GERMÁN ROSCIO", parroquias: ["SAN JUAN DE LOS MORROS", "CANTAGRALLO", "PARAPARA"] }] },
  { nu_geografico: 680, nb_geografico: "EDO. MÉRIDA", municipios: [{ nu_geografico: 681, nb_geografico: "MP. LIBERTADOR", parroquias: ["EL SAGRARIO", "MILLA", "OSUNA RODRÍGUEZ", "SPINETTI DINI", "DOMINGO PEÑA"] }] },
  { nu_geografico: 850, nb_geografico: "EDO. MONAGAS", municipios: [{ nu_geografico: 851, nb_geografico: "MP. MATURÍN", parroquias: ["SAN SIMÓN", "ALTO DE LOS GODOS", "BOQUERÓN", "LAS COCUIZAS", "SANTA CRUZ"] }] },
  { nu_geografico: 900, nb_geografico: "EDO. NUEVA ESPARTA", municipios: [{ nu_geografico: 901, nb_geografico: "MP. MARIÑO", parroquias: ["PORLAMAR"] }, { nu_geografico: 902, nb_geografico: "MP. MANEIRO", parroquias: ["PAMPATAR"] }, { nu_geografico: 903, nb_geografico: "MP. ARISMENDI", parroquias: ["LA ASUNCIÓN"] }] },
  { nu_geografico: 950, nb_geografico: "EDO. PORTUGUESA", municipios: [{ nu_geografico: 951, nb_geografico: "MP. GUANARE", parroquias: ["GUANARE", "CÓRDOBA", "SAN JUAN DE GUANAGUANARE"] }, { nu_geografico: 952, nb_geografico: "MP. PÁEZ", parroquias: ["ACARIGUA", "PAYARA", "PIMPINELA"] }] },
  { nu_geografico: 1000, nb_geografico: "EDO. SUCRE", municipios: [{ nu_geografico: 1001, nb_geografico: "MP. SUCRE", parroquias: ["ALTAGRACIA", "SANTA INÉS", "VALENTÍN VALIENTE", "AYACUCHO"] }, { nu_geografico: 1002, nb_geografico: "MP. BERMÚDEZ", parroquias: ["CARÚPANO", "SANTA CATALINA", "SANTA ROSA"] }] },
  { nu_geografico: 1150, nb_geografico: "EDO. TRUJILLO", municipios: [{ nu_geografico: 1151, nb_geografico: "MP. VALERA", parroquias: ["JUAN IGNACIO MONTILLA", "LA BEATRIZ", "MERCEDES DÍAZ", "SAN LUIS"] }, { nu_geografico: 1152, nb_geografico: "MP. TRUJILLO", parroquias: ["MATRIZ", "CRISTÓBAL MENDOZA", "CHIQUINQUIRÁ", "MONSEÑOR CARRILLO"] }] },
  { nu_geografico: 1200, nb_geografico: "EDO. YARACUY", municipios: [{ nu_geografico: 1201, nb_geografico: "MP. SAN FELIPE", parroquias: ["SAN FELIPE", "ALBARICO", "SAN JAVIER"] }, { nu_geografico: 1202, nb_geografico: "MP. INDEPENDENCIA", parroquias: ["INDEPENDENCIA"] }] }
];

export const CENTROS_SALUD_POR_ESTADO: Record<string, string[]> = {
  '1490': [
    "HOSPITAL DR. JOSÉ MARÍA VARGAS (LA GUAIRA)",
    "HOSPITAL MATERNO INFANTIL ANA TERESA DE JESÚS PONCE (MACUTO)",
    "HOSPITAL DR. RAFAEL MEDINA JIMÉNEZ (PERIFÉRICO DE PARIATA)",
    "CENTRO INTEGRAL DE SALUD DE MAIQUETÍA",
    "CLÍNICA ALFA (MAIQUETÍA)",
    "CLÍNICA SAN JOSÉ (LA GUAIRA)",
    "MATERNIDAD DE CARAYACA",
    "AMBULATORIO DE CARABALLEDA",
    "AMBULATORIO DE NAIGUATÁ",
    "AMBULATORIO DE CATIA LA MAR"
  ],
  '2': [
    "MATERNIDAD CONCEPCIÓN PALACIOS",
    "HOSPITAL UNIVERSITARIO DE CARACAS (HUC)",
    "HOSPITAL DR. JOSÉ MARÍA VARGAS (CARACAS)",
    "HOSPITAL DR. JOSÉ IGNACIO BALDÓ (EL ALGODONAL)",
    "HOSPITAL DR. MIGUEL PÉREZ CARREÑO",
    "HOSPITAL MATERNO INFANTIL HUGO CHÁVEZ (EL VALLE)",
    "HOSPITAL MATERNO INFANTIL CARICUAO",
    "HOSPITAL MILITAR DR. CARLOS ARVELO",
    "HOSPITAL DE CLÍNICAS CARACAS",
    "POLICLÍNICA METROPOLITANA",
    "CLÍNICA EL ÁVILA",
    "CLÍNICA SANTA SOFÍA"
  ],
  '752': [
    "HOSPITAL DR. DOMINGO LUCIANI (EL LLANITO)",
    "HOSPITAL GENERAL DE GUATIRE / GUARENAS",
    "HOSPITAL VICTORINO SANTAELLA (LOS TEQUES)",
    "MATERNIDAD DEL ESTE SANTA ANA",
    "PRONTO SOCORRO DE CHARALLAVE"
  ],
  '332': [
    "CIUDAD HOSPITALARIA DR. ENRIQUE TEJERA (CHET - VALENCIA)",
    "HOSPITAL MATERNO INFANTIL JULIA BENÍTEZ (GUACARA)",
    "HOSPITAL DR. ADOLFO PRINCE LARA (PUERTO CABELLO)"
  ],
  '1296': [
    "HOSPITAL CENTRAL DE MARACAIBO (DR. URQUINAONA)",
    "HOSPITAL GENERAL DEL SUR DR. PEDRO ITURBE",
    "MATERNIDAD DR. ARMANDO CASTILLO PLAZA",
    "HOSPITAL UNIVERSITARIO DE MARACAIBO"
  ],
  '1050': [
    "HOSPITAL CENTRAL DE SAN CRISTÓBAL",
    "HOSPITAL MILITAR CAPITÁN (AV) DR. GUILLERMO HERNÁNDEZ DA ROCHA"
  ],
  '26': [
    "HOSPITAL DR. LUIS RAZETTI (BARCELONA)",
    "HOSPITAL GENERAL DE EL TIGRE"
  ],
  '574': [
    "HOSPITAL ANTONIO MARÍA PINEDA (BARQUISIMETO)",
    "HOSPITAL UNIVERSITARIO DE PEDIATRÍA DR. AGUSTÍN ZUBILLAGA"
  ],
  '137': [
    "HOSPITAL CENTRAL DE MARACAY",
    "MATERNIDAD LA FLORESTA"
  ]
};

export const CENTROS_SALUD_GENERALES = [
  "HOSPITAL CENTRAL",
  "HOSPITAL GENERAL",
  "MATERNIDAD MUNICIPAL",
  "AMBULATORIO URBANO",
  "CLÍNICA PRIVADA",
  "PARTO EN DOMICILIO / COMUNITARIO"
];

export const PAISES_CATALOGO = [
  "VENEZUELA",
  "COLOMBIA",
  "ESPAÑA",
  "ESTADOS UNIDOS",
  "ITALIA",
  "PORTUGAL",
  "BRASIL",
  "PERÚ",
  "ECUADOR",
  "CHILE",
  "ARGENTINA",
  "MÉXICO",
  "PANAMÁ",
  "REPÚBLICA DOMINICANA",
  "CUBA",
  "HAITÍ",
  "TRINIDAD Y TOBAGO",
  "FRANCIA",
  "ALEMANIA",
  "CHINA",
  "OTRO PAÍS"
];
