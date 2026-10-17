/**
 * Reads assets/aasaam/ir_*.svg (aasaam/brand-icons, CC0)
 * and emits catalog + optimized SVG data for the package.
 *
 * Marks are monochrome 24×24. Mono always uses currentColor.
 * Color uses a brand fill when listed in BRAND_COLORS, otherwise
 * the same currentColor glyph as mono.
 */
import { mkdir, readdir, readFile, writeFile, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { optimize } from "svgo";
import { normalizeOpticalViewBox } from "./lib/optical-normalize.mjs";
import {
  flushComponentRegistry,
  claimComponentName,
  preferredIconName,
  unregisterIds,
} from "./lib/component-registry.mjs";
import { brandColorsField } from "./lib/brand-colors.mjs";
import { nameFaForId } from "./lib/name-fa.mjs";


const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = join(root, "assets", "aasaam");
const outRoot = join(root, "src", "generated", "aasaam");

const CATEGORY = {
  id: "aasaam",
  prefix: "aasaam",
  labelEn: "Aasaam Brands",
  labelFa: "آیکون‌های آسام",
};

/** Prefer persian-labs Bank / Gateway / Insurance icons over these aasaam mono duplicates. */
const SKIP_SLUGS = new Set([
  "tejarat",
  "saderat",
  "ghavamin",
  "hekmat",
  "futurebank",
  // Banks
  "ansar",
  "ayandeh",
  "armanmeli",
  "caspian",
  "dey",
  "eghtesadnovin",
  "gardeshgari",
  "karafarin",
  "keshavarzi",
  "kosar",
  "markazi",
  "maskan",
  "mehriran",
  "mellat",
  "melli",
  "parsian",
  "pasargad",
  "postbank",
  "refah",
  "saman",
  "shahr",
  "sina",
  "tosee",
  "toseetaavon", // prefer bank-tosee-taavon
  "toseesaderat", // prefer bank-tosee-saderat
  // Payments
  "asanpardakht",
  "shaparak",
  "zarinpal",
  // Insurance-named marks that collide in finance group
  "bimehiran",
  "bimehmarkazi",
  "bimehsalamat",
  "paydarymelli",
  // Prefer persian-labs / lps over aasaam mono duplicates (keep sepah ≠ bank-sepah)
  "aparat",
  "asiatech",
  "bale",
  "behrooz",
  "behzisti",
  "borna",
  "butane",
  "cafebazaar",
  "digikala",
  "divar",
  "fidibo",
  "gap",
  "golrang",
  "irancell",
  "irna",
  "minoo",
  "noor",
  "paxan",
  "post",
  "resalat",
  "rightel",
  "sabteahval",
  "sanjesh",
  "sarmayeh",
  "shahrvand",
  "sharif",
  "shatel",
  "sheypoor",
  "snapp",
  "snowa",
  "standard",
  "torob",
  "varzesh3",
  "zoomit",
]);

/**
 * Official brand fills for color variant (Simple Icons–style solid mark).
 * Checkmark cutouts stay transparent so the host background shows through.
 */
const BRAND_COLORS = {
  // Catalog order — solid Simple Icons–style fills (skip = no reliable logo color)
  "40tikke": "#E85D04", // logo URL unreliable; warm craft accent from legacy mark refs
  "55online": "#485CC7", // 55online.ir SVG fill (+ favicon ≈ #4455CC)
  "7sobh": "#065D91", // 7sobh.com theme-color (favicon blue-dominant)
  // 9sobh — not found
  aasaam: "#4A4A4A", // aasaam.com theme-color / tile
  // abidi — no direct logo path
  afkarnews: "#880000", // afkarnews.com/images/aasaam.png dominant
  // afta, amar, ansar — not found
  aparat: "#ED145B", // aparat.com/logo — Simple Icons / brand palette
  armanmeli: "#00A651", // armanmeli.ir favicon green (≈ #00AA55)
  // arshehonline, artdayme — not found
  arvancloud: "#00BABA", // Brandfetch / arvancloud favicon teal
  asanpardakht: "#F04923", // asanpardakht Logofooter.svg .st0
  asiatech: "#009FE3", // rangebrand.ir primary blue (logo URL 404)
  shaparak: "#1D93D1", // شاپرک — official network blue
  zarinpal: "#0A33FF", // زرین‌پال — primary blue (yellow is accent; solid mark needs contrast)

  // Apps-group mono marks — solid Simple Icons–style fills for color variant
  authin: "#2563EB",
  bitbaan: "#00A651",
  blogfa: "#FF6600",
  cafebazaar: "#0AAD2D",
  deema: "#FF5722",
  digisargarmy: "#ED1944",
  enamad: "#00A651",
  hiweb: "#00AEEF",
  irancell: "#FFCB05",
  rightel: "#9C2776",
  shatel: "#1A457F",
  yektanet: "#6B2D9B",

  // Food / retail mono marks
  behnoosh: "#EC1B2E",
  canbo: "#E30613",
  digikala: "#ED1944",
  divar: "#A62626",
  golrang: "#E3000F",
  kanonvokala: "#2E6A94",
  sheypoor: "#0060FF",
  torob: "#E91E31",

  // Mobility mono marks
  carpino: "#EC008C",
  ikco: "#0C4DA2",
  neshanonline: "#EF5E60",
  saipa: "#E77817",
  snapp: "#00E261",

  // Media mono marks
  "9sobh": "#0B5F8A",
  ayandnews: "#3A7FD0",
  baeghtesad: "#0D47A1",
  bartarinha: "#E53935",
  borna: "#E11B22",
  cannews: "#3A7FD0",
  didgahemrooz: "#37474F",
  doctv: "#5C6BC0",
  eghtesad100: "#1B5E20",
  eghtesadnews: "#C62828",
  eghtesadonline: "#3A7FD0",
  etemad: "#B71C1C",
  faradeed: "#0D47A1",
  farazdaily: "#37474F",
  fardanews: "#C62828",
  fartaknews: "#3A7FD0",
  fartakvarzeshi: "#2E7D32",
  fidibo: "#23211F",
  gashtaninews: "#00695C",
  gostaresh: "#3A7FD0",
  honarmrooz: "#6A1B9A",
  honaronline: "#6A1B9A",
  iana: "#2E7D32",
  ilna: "#C62828",
  khanefootball: "#1B5E20",
  mahyanews: "#3A7FD0",
  mediaad: "#FF5722",
  mehreghtesad: "#FF0000",
  mehrnews: "#FF0000",
  mojnews: "#0277BD",
  moroornews: "#455A64",
  mostaghelnewspaper: "#4A4A4A",
  namehnews: "#3A7FD0",
  nournews: "#F9A825",
  parsnews: "#3A7FD0",
  rasadeghtesadi: "#0D47A1",
  rasadvarzeshi: "#2E7D32",
  rastaanews: "#C62828",
  shayanews: "#6A1B9A",
  shomanews: "#3A7FD0",
  shomavaeghtesad: "#0D47A1",
  sobheno: "#E65100",
  sobhtazeh: "#EF6C00",
  taadolnewspaper: "#3A7FD0",
  taraznameheghtesad: "#1B5E20",
  varzeshtv: "#21A5CC",
  zoomit: "#E1082C",
  varzesh3: "#E74436",

  // Org mono marks
  behzisti: "#EA6627",
  bmn: "#3A7FD0",
  cra: "#0D47A1",
  cyberpolice: "#1A237E",
  daneshbonyan: "#00838F",
  doe: "#2E7D32",
  firedepartment: "#D32F2F",
  iau: "#2A52D4",
  ibto: "#E3000F",
  ictgov: "#3A7FD0",
  perspolicefc: "#0D47A1",
  womangov: "#AD1457",


  // Finance mono marks
  ansar: "#EEB900",
  armanmeli: "#00A651",
  ayandeh: "#6E2616",
  bazarebours: "#007B3F",
  bimehiran: "#4548AE",
  bimehmarkazi: "#009EDD",
  bimehsalamat: "#00897B",
  bourseon: "#3A7FD0",
  caspian: "#4E5A6C",
  dey: "#008B9A",
  eghtesadnovin: "#662892",
  futurebank: "#4DA2E7",
  gardeshgari: "#B11116",
  ghavamin: "#007D3D",
  hekmat: "#4A66A5",
  karafarin: "#AB7342",
  keshavarzi: "#1F261A",
  markazi: "#00194A",
  maskan: "#EC520D",
  mehriran: "#209B1C",
  mellat: "#BA0B22",
  melli: "#F1AF0E",
  parsian: "#B27D53",
  pasargad: "#FECC09",
  paydarymelli: "#C62828",
  postbank: "#14763E",
  refah: "#2B4F8F",
  refahstore: "#2B4F8F",
  saderat: "#45429A",
  saman: "#7DCDF1",
  samandehi: "#3A7FD0",
  sazmanmellijavanan: "#3A7FD0",
  shahr: "#D8262C",
  sina: "#277EB5",
  tejarat: "#4562B0",
  tejaratfarda: "#4562B0",
  tosee: "#8F2426",
  toseeirani: "#3A7FD0",
  toseesaderat: "#006D08",
  toseetaavon: "#CDCCCC",
  tse: "#007B3F",
  // Brands-group leftover mono marks
  "40tikke": "#E85D04",
  "55online": "#485CC7",
  aasaam: "#4A4A4A",
  abidi: "#3A7FD0",
  afta: "#0D47A1",
  amar: "#3A7FD0",
  arshehonline: "#3A7FD0",
  artdayme: "#6A1B9A",
  baham: "#00897B",
  bale: "#00B894",
  bazarebours: "#007B3F",
  behran: "#C62828",
  behrooz: "#C62828",
  bitido: "#F9A825",
  butane: "#CC030E",
  chabokonline: "#3A7FD0",
  cloob: "#1E88E5",
  cspf: "#1B5E20",
  "donya-e-eqtesad": "#0D47A1",
  donyayemadan: "#5D4037",
  ecoiran: "#2E7D32",
  econegar: "#3A7FD0",
  ecunion: "#3A7FD0",
  eima: "#00838F",
  eitaa: "#FF7534",
  esamta: "#3A7FD0",
  fajrfilmfestival: "#C62828",
  gap: "#17DC7E",
  hafttappeh: "#2E7D32",
  hepco: "#F57C00",
  igap: "#B8D54F",
  ihdae: "#C62828",
  iranart: "#6A1B9A",
  iraneurope: "#3A7FD0",
  iranmall: "#C62828",
  irannsr: "#3A7FD0",
  iranol: "#F57C00",
  irantvto: "#3A7FD0",
  iranzamin: "#C62828",
  irib: "#000D7F",
  irib1: "#0074DB",
  irib2: "#03A4EC",
  irib3: "#D11A5D",
  irib4: "#1A9FA9",
  irib5: "#53B2F4",
  irib7: "#3A7FD0",
  irimo: "#0277BD",
  irinn: "#C62828",
  irisl: "#0D47A1",
  iritco: "#3A7FD0",
  irna: "#0C3555",
  irost: "#3A7FD0",
  isc: "#3A7FD0",
  itrc: "#0D47A1",
  iums: "#04AEAE",
  iust: "#261774",
  jadidpress: "#C62828",
  jahanemana: "#3A7FD0",
  jamaran: "#2E7D32",
  jaygah8: "#F9A825",
  kanoonparvaresh: "#C62828",
  kavirtire: "#4A4A4A",
  keshavarzi: "#2E7D32",
  keshavarzplus: "#43A047",
  khabareazad: "#C62828",
  khabarerooz: "#C62828",
  khabarfoori: "#D32F2F",
  khabargardoon: "#3A7FD0",
  khabaronline: "#5A5A90",
  khanehcinema: "#A21412",
  khavarmianeh: "#0D47A1",
  khodrotak: "#2A7AD4",
  khoondanionline: "#6A1B9A",
  khwarizmi: "#134C83",
  kosar: "#3A7FD0",
  maj: "#0D47A1",
  maktabkhooneh: "#009BA6",
  mamlekatonline: "#3A7FD0",
  mapna: "#0D47A1",
  markazi: "#1B5E20",
  mci: "#0095DA",
  mcth: "#8D6E63",
  medu: "#3A7FD0",
  melal: "#3A7FD0",
  metrotehran: "#F9D42B",
  minoo: "#FFEE00",
  mohme: "#00897B",
  mojdehartgallery: "#6A1B9A",
  moniban: "#3A7FD0",
  mosalas: "#C62828",
  mostaghelonline: "#4A4A4A",
  msc: "#3A7FD0",
  msrt: "#0D47A1",
  msy: "#2E7D32",
  "mun-ahvaz": "#095700",
  "mun-arak": "#095700",
  "mun-ardabil": "#095700",
  "mun-bandarabbas": "#095700",
  "mun-birjand": "#095700",
  "mun-bojnurd": "#095700",
  "mun-bushehr": "#095700",
  "mun-gorgan": "#095700",
  "mun-hamedan": "#095700",
  "mun-ilam": "#095700",
  "mun-isfahan": "#095700",
  "mun-karaj": "#095700",
  "mun-kerman": "#095700",
  "mun-kermanshah": "#095700",
  "mun-khorramabad": "#095700",
  "mun-mashhad": "#095700",
  "mun-qazvin": "#095700",
  "mun-qom": "#095700",
  "mun-rasht": "#095700",
  "mun-sanandaj": "#095700",
  "mun-sari": "#095700",
  "mun-semnan": "#095700",
  "mun-shiraz": "#095700",
  "mun-tabriz": "#095700",
  "mun-tehran": "#095700",
  "mun-urmia": "#095700",
  "mun-yasuj": "#095700",
  "mun-yazd": "#095700",
  "mun-zahedan": "#095700",
  "mun-zanjan": "#095700",
  mvm: "#C62828",
  nahaltv: "#2E7D32",
  namayeshtv: "#FF7711",
  nasim: "#FF053C",
  ndf: "#0D47A1",
  niniban: "#EC407A",
  nlai: "#3A7FD0",
  nomanzi: "#6A1B9A",
  noor: "#F9A825",
  noorvision: "#F9A825",
  ntdc: "#0D47A1",
  ofoghtv: "#1CAFA2",
  oil: "#4A4A4A",
  okcs: "#3A7FD0",
  omidtv: "#E67303",
  pakat: "#3A7FD0",
  panjere: "#3A7FD0",
  parsappliance: "#3A7FD0",
  parskhazar: "#FA0302",
  parsonline: "#DA251D",
  parspal: "#3A7FD0",
  paxan: "#3A7FD0",
  payameno: "#3A7FD0",
  pazonline: "#FF5722",
  pec: "#0D47A1",
  petrotahlil: "#5D4037",
  pishnahadevizheh: "#E53935",
  pmo: "#0D47A1",
  pooyatv: "#FEC10E",
  post: "#FFC121",
  promizer: "#7B1FA2",
  qurantv: "#846C35",
  rcs: "#E30613",
  resalat: "#3A7FD0",
  revayatnameh: "#5D4037",
  rokna: "#C62828",
  sabteahval: "#009540",
  sadad: "#0D47A1",
  sairan: "#3A7FD0",
  salamattv: "#028E13",
  samt: "#3A7FD0",
  sanatmadan: "#5D4037",
  sanjagh: "#E91E63",
  sanjesh: "#013F7C",
  sapp: "#3A7FD0",
  sargarmiyerooz: "#FF5722",
  sarmayeh: "#0D47A1",
  semnantile: "#795548",
  sepah: "#1B5E20",
  setareparsi: "#C62828",
  shaidbeheshtiuni: "#003663",
  sharghonline: "#C62828",
  sharif: "#1D2D83",
  shetab: "#0D47A1",
  shomareh1: "#C62828",
  shomatv: "#3A7FD0",
  sibapp: "#0047FF",
  sindad: "#3A7FD0",
  snowa: "#236CAA",
  sornakhabar: "#C62828",
  standard: "#159B86",
  systemgroup: "#D6001C",
  taavoneslami: "#2E7D32",
  tamashatv: "#4F0810",
  tamin: "#2E3192",
  tap30: "#F15A22",
  tapesh3: "#E53935",
  tapsell: "#FF5722",
  tarafdari: "#C62828",
  tarintop: "#3A7FD0",
  tarjoman: "#6A1B9A",
  tavakoli: "#5D4037",
  tavanir: "#FBC02D",
  tci: "#27318C",
  tehraneonline: "#3A7FD0",
  tehranuni: "#0BAEDD",
  tinn: "#3A7FD0",
  titrekootah: "#C62828",
  tractorclub: "#C20605",
  tse: "#007B3F",
  tvnasim: "#FF053C",
  varandaz: "#3A7FD0",
  virgool: "#1A8917",
  wikigardi: "#3A7FD0",
  xvision: "#004A8F",
  zenhar: "#C62828",
  bale: "#00B894",
  bazarebours: "#007B3F",
  behran: "#C62828",
  behrooz: "#C62828",
  bitido: "#F9A825",
  butane: "#CC030E",
  chabokonline: "#3A7FD0",
  cloob: "#1E88E5",
  cspf: "#1B5E20",
  "donya-e-eqtesad": "#0D47A1",
  donyayemadan: "#5D4037",
  ecoiran: "#2E7D32",
  econegar: "#3A7FD0",
  ecunion: "#3A7FD0",
  eima: "#00838F",
  eitaa: "#FF7534",
  esamta: "#3A7FD0",
  fajrfilmfestival: "#C62828",
  gap: "#17DC7E",
  hafttappeh: "#2E7D32",
  hepco: "#F57C00",
  igap: "#B8D54F",
  ihdae: "#C62828",
  iranart: "#6A1B9A",
  iraneurope: "#3A7FD0",
  iranmall: "#C62828",
  irannsr: "#3A7FD0",
  iranol: "#F57C00",
  irantvto: "#3A7FD0",
  iranzamin: "#C62828",
  irib: "#000D7F",
  irib1: "#0074DB",
  irib2: "#03A4EC",
  irib3: "#D11A5D",
  irib4: "#1A9FA9",
  irib5: "#53B2F4",
  irib7: "#3A7FD0",
  irimo: "#0277BD",
  irinn: "#C62828",
  irisl: "#0D47A1",
  iritco: "#3A7FD0",
  irna: "#0C3555",
  irost: "#3A7FD0",
  isc: "#3A7FD0",
  itrc: "#0D47A1",
  iums: "#04AEAE",
  iust: "#261774",
  jadidpress: "#C62828",
  jahanemana: "#3A7FD0",
  jamaran: "#2E7D32",
  jaygah8: "#F9A825",
  kanoonparvaresh: "#C62828",
  kavirtire: "#4A4A4A",
  keshavarzi: "#2E7D32",
  keshavarzplus: "#43A047",
  khabareazad: "#C62828",
  khabarerooz: "#C62828",
  khabarfoori: "#D32F2F",
  khabargardoon: "#3A7FD0",
  khabaronline: "#5A5A90",
  khanehcinema: "#A21412",
  khavarmianeh: "#0D47A1",
  khodrotak: "#2A7AD4",
  khoondanionline: "#6A1B9A",
  khwarizmi: "#134C83",
  kosar: "#3A7FD0",
  maj: "#0D47A1",
  maktabkhooneh: "#009BA6",
  mamlekatonline: "#3A7FD0",
  mapna: "#0D47A1",
  markazi: "#1B5E20",
  mci: "#0095DA",
  mcth: "#8D6E63",
  medu: "#3A7FD0",
  melal: "#3A7FD0",
  metrotehran: "#F9D42B",
  minoo: "#FFEE00",
  mohme: "#00897B",
  mojdehartgallery: "#6A1B9A",
  moniban: "#3A7FD0",
  mosalas: "#C62828",
  mostaghelonline: "#4A4A4A",
  msc: "#3A7FD0",
  msrt: "#0D47A1",
  msy: "#2E7D32",
  "mun-ahvaz": "#095700",
  "mun-arak": "#095700",
  "mun-ardabil": "#095700",
  "mun-bandarabbas": "#095700",
  "mun-birjand": "#095700",
  "mun-bojnurd": "#095700",
  "mun-bushehr": "#095700",
  "mun-gorgan": "#095700",
  "mun-hamedan": "#095700",
  "mun-ilam": "#095700",
  "mun-isfahan": "#095700",
  "mun-karaj": "#095700",
  "mun-kerman": "#095700",
  "mun-kermanshah": "#095700",
  "mun-khorramabad": "#095700",
  "mun-mashhad": "#095700",
  "mun-qazvin": "#095700",
  "mun-qom": "#095700",
  "mun-rasht": "#095700",
  "mun-sanandaj": "#095700",
  "mun-sari": "#095700",
  "mun-semnan": "#095700",
  "mun-shiraz": "#095700",
  "mun-tabriz": "#095700",
  "mun-tehran": "#095700",
  "mun-urmia": "#095700",
  "mun-yasuj": "#095700",
  "mun-yazd": "#095700",
  "mun-zahedan": "#095700",
  "mun-zanjan": "#095700",
  mvm: "#C62828",
  nahaltv: "#2E7D32",
  namayeshtv: "#FF7711",
  nasim: "#FF053C",
  ndf: "#0D47A1",
  niniban: "#EC407A",
  nlai: "#3A7FD0",
  nomanzi: "#6A1B9A",
  noor: "#F9A825",
  noorvision: "#F9A825",
  ntdc: "#0D47A1",
  ofoghtv: "#1CAFA2",
  oil: "#4A4A4A",
  okcs: "#3A7FD0",
  omidtv: "#E67303",
  pakat: "#3A7FD0",
  panjere: "#3A7FD0",
  parsappliance: "#3A7FD0",
  parskhazar: "#FA0302",
  parsonline: "#DA251D",
  parspal: "#3A7FD0",
  paxan: "#3A7FD0",
  payameno: "#3A7FD0",
  pazonline: "#FF5722",
  pec: "#0D47A1",
  petrotahlil: "#5D4037",
  pishnahadevizheh: "#E53935",
  pmo: "#0D47A1",
  pooyatv: "#FEC10E",
  post: "#FFC121",
  promizer: "#7B1FA2",
  qurantv: "#846C35",
  rcs: "#E30613",
  resalat: "#3A7FD0",
  revayatnameh: "#5D4037",
  rokna: "#C62828",
  sabteahval: "#009540",
  sadad: "#0D47A1",
  sairan: "#3A7FD0",
  salamattv: "#028E13",
  samt: "#3A7FD0",
  sanatmadan: "#5D4037",
  sanjagh: "#E91E63",
  sanjesh: "#013F7C",
  sapp: "#3A7FD0",
  sargarmiyerooz: "#FF5722",
  sarmayeh: "#0D47A1",
  semnantile: "#795548",
  sepah: "#1B5E20",
  setareparsi: "#C62828",
  shaidbeheshtiuni: "#003663",
  sharghonline: "#C62828",
  sharif: "#1D2D83",
  shetab: "#0D47A1",
  shomareh1: "#C62828",
  shomatv: "#3A7FD0",
  sibapp: "#0047FF",
  sindad: "#3A7FD0",
  snowa: "#236CAA",
  sornakhabar: "#C62828",
  standard: "#159B86",
  systemgroup: "#D6001C",
  taavoneslami: "#2E7D32",
  tamashatv: "#4F0810",
  tamin: "#2E3192",
  tap30: "#F15A22",
  tapesh3: "#E53935",
  tapsell: "#FF5722",
  tarafdari: "#C62828",
  tarintop: "#3A7FD0",
  tarjoman: "#6A1B9A",
  tavakoli: "#5D4037",
  tavanir: "#FBC02D",
  tci: "#27318C",
  tehraneonline: "#3A7FD0",
  tehranuni: "#0BAEDD",
  tinn: "#3A7FD0",
  titrekootah: "#C62828",
  tractorclub: "#C20605",
  tse: "#007B3F",
  tvnasim: "#FF053C",
  varandaz: "#3A7FD0",
  virgool: "#1A8917",
  wikigardi: "#3A7FD0",
  xvision: "#004A8F",
  zenhar: "#C62828",
  bale: "#00B894",
  // Multi-color mark: blue ring + red wordmark — keep fills from source SVG
  behran: "preserve",
  eitaa: "#FF7534", // ایتا — official brand orange (eitaa.com/page/badge)
  esteghlalfc: "#0067AD", // استقلال — primary blue from official mark / user logo
};

/** Map well-known slugs to nicer FA names. */
const NAME_FA = {
  digikala: "دیجی‌کالا",
  aparat: "آپارات",
  snapp: "اسنپ",
  carpino: "کارپینو",
  ikco: "ایران‌خودرو",
  neshanonline: "نشان",
  saipa: "سایپا",
  tapsi: "تپسی",
  divar: "دیوار",
  cafebazaar: "کافه‌بازار",
  zarinpal: "زرین‌پال",
  "40tikke": "چهل‌تیکه",
  "55online": "۵۵ آنلاین",
  "7sobh": "هفت صبح",
  asanpardakht: "آسان‌پرداخت",
  behran: "بهران",
  melli: "بانک ملی",
  mellat: "بانک ملت",
  saman: "بانک سامان",
  tejarat: "بانک تجارت",
  irancell: "ایرانسل",
  hamraheaval: "همراه‌اول",
  rightel: "رایتل",
  bale: "بله",
  eitaa: "ایتا",
  esteghlalfc: "استقلال",
  rubika: "روبیکا",
  soroush: "سروش",
  shad: "شاد",
  filimo: "فیلیمو",
  namava: "نماوا",
  torob: "ترب",
  sheypoor: "شیپور",
  enamad: "اینماد",
  shaparak: "شاپرک",
  asiatech: "آسیاتک",
  arvancloud: "ابر آروان",
  zoomit: "زومیت",
  varzesh3: "ورزش ۳",
  aasaam: "آسام",
};

/**
 * Per-icon optical-normalize overrides.
 * Wide wordmarks default to a zoom that clips ends — set maxZoom: 1 to keep full ink.
 */
const OPTICAL_OPTIONS = {
  zarinpal: { maxZoom: 1 },
  // Checkmark wordmark — default zoom clips the sides.
  snapp: { maxZoom: 1 },
  // Wide wordmark — default zoom clips left/right.
  bourseon: { maxZoom: 1 },
};

function kebab(value) {
  return value
    .replace(/^ir_/i, "")
    .replace(/\.svg$/i, "")
    .replace(/_/g, "-")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function pascal(value) {
  return value
    .split("-")
    .filter(Boolean)
    .map((part) => part[0].toUpperCase() + part.slice(1))
    .join("");
}

function titleFromSlug(slug) {
  return slug
    .split("-")
    .map((p) =>
      p.length <= 2 ? p.toUpperCase() : p[0].toUpperCase() + p.slice(1),
    )
    .join(" ");
}

function optimizeSvg(svg) {
  return optimize(svg, {
    multipass: true,
    plugins: ["preset-default", "removeDimensions"],
  }).data;
}

/** Stamp an explicit fill onto every paintable shape (not just parent <g>). */
function applyShapeFill(inner, fill) {
  return inner
    .replace(/\sfill="[^"]*"/gi, "")
    .replace(
      /<(path|circle|rect|polygon|ellipse|polyline)\b/gi,
      `<$1 fill="${fill}"`,
    );
}

function parseSvg(svg, fill = "currentColor") {
  const viewBox = svg
    .match(/viewBox=["']([^"']+)["']/i)?.[1]
    ?.trim()
    .split(/[ ,]+/)
    .map(Number);
  if (!viewBox || viewBox.length !== 4 || viewBox.some(Number.isNaN)) {
    throw new Error("SVG is missing a valid viewBox");
  }
  let inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/i, "")
    .replace(/<\/svg>[\s\S]*$/i, "")
    .replace(/<(title|desc)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
    .replace(/\sdata-name=("[^"]*"|'[^']*')/gi, "")
    .replace(/\s+/g, " ")
    .replace(/> </g, "><")
    .trim();
  if (fill !== "preserve") {
    inner = applyShapeFill(inner, fill);
  }
  const body = `<g>${inner}</g>`;
  return {
    viewBox: viewBox.join(" "),
    width: viewBox[2],
    height: viewBox[3],
    body,
  };
}

function serialize(value) {
  return JSON.stringify(value);
}

const files = (await readdir(sourceRoot))
  .filter((name) => name.toLowerCase().endsWith(".svg"))
  .sort();

if (files.length === 0) {
  throw new Error(`No SVGs found under ${sourceRoot}`);
}

unregisterIds((id) => id.startsWith("aasaam-"));

const icons = [];
const data = {};

for (const file of files) {
  const slug = kebab(file);
  if (SKIP_SLUGS.has(slug)) continue;
  const id = `aasaam-${slug}`;
  const source = await readFile(join(sourceRoot, file), "utf8");
  // Wide wordmarks: skip optical zoom so left/right aren't clipped in the square.
  const opticalOpts = OPTICAL_OPTIONS[slug];
  const optimized = normalizeOpticalViewBox(
    optimizeSvg(source),
    opticalOpts,
  );
  const brandFill = BRAND_COLORS[slug];
  const mono = parseSvg(optimized);
  const color = brandFill
    ? parseSvg(optimized, brandFill === "preserve" ? "preserve" : brandFill)
    : mono;
  const variants = { color, mono };
  const nameEn = titleFromSlug(slug);
  const nameFa = nameFaForId(id) ?? NAME_FA[slug] ?? nameEn;
  const componentName = claimComponentName(preferredIconName(slug), id);

  icons.push({
    id,
    slug,
    category: CATEGORY.id,
    nameEn,
    nameFa,
    componentName,
    viewBox: mono.viewBox,
    aspectRatio: mono.width / mono.height,
    brandFill: brandFill ?? null,
  });
  data[id] = variants;
}

icons.sort((a, b) => a.id.localeCompare(b.id));

await rm(outRoot, { recursive: true, force: true });
await mkdir(outRoot, { recursive: true });
await mkdir(join(outRoot, "icons"), { recursive: true });

await writeFile(
  join(outRoot, "data.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `import type { IconVariantData } from "../../types";\n\n` +
    `export const data: Record<string, IconVariantData> = ${serialize(data)};\n`,
);

const catalogEntries = icons.map((icon) => ({
  id: icon.id,
  nameFa: icon.nameFa,
  nameEn: icon.nameEn,
  componentName: icon.componentName,
  category: icon.category,
  source: "aasaam",
  sourceUrl: "https://github.com/aasaam/brand-icons",
  verificationStatus: "verified",
  notes: icon.brandFill
    ? `SVG from aasaam/brand-icons (CC0). Color uses brand fill ${icon.brandFill}; mono uses currentColor.`
    : "SVG from aasaam/brand-icons (CC0). Monochrome mark; color/mono variants share the same glyph (currentColor).",
  ...brandColorsField(icon.id),
  viewBox: icon.viewBox,
  aspectRatio: icon.aspectRatio,
}));

await writeFile(
  join(outRoot, "catalog.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `import type { IconCategoryMeta, IconManifestEntry } from "../../types";\n\n` +
    `export const aasaamCategory: IconCategoryMeta = ${serialize({
      ...CATEGORY,
      count: icons.length,
    })};\n\n` +
    `export const aasaamManifest: IconManifestEntry[] = ${serialize(catalogEntries)};\n`,
);

// Split named components into chunks to keep files manageable
const CHUNK = 80;
const chunkNames = [];
for (let i = 0; i < icons.length; i += CHUNK) {
  const slice = icons.slice(i, i + CHUNK);
  const chunkIndex = Math.floor(i / CHUNK);
  const chunkFile = `chunk-${chunkIndex}.tsx`;
  chunkNames.push(chunkFile.replace(/\.tsx$/, ""));
  const lines = [
    `// Generated by scripts/generate-aasaam.mjs — do not edit.`,
    `import { createPersianLabsIcon } from "../../../create-persian-labs-icon";`,
    `import { data } from "../data";`,
    ``,
  ];
  for (const icon of slice) {
    lines.push(
      `export const ${icon.componentName} = createPersianLabsIcon(${serialize(icon.id)}, ${serialize(icon.componentName)}, data[${serialize(icon.id)}]!);`,
    );
  }
  lines.push("");
  await writeFile(join(outRoot, "icons", chunkFile), lines.join("\n"));
}

await writeFile(
  join(outRoot, "icons", "index.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    chunkNames.map((name) => `export * from "./${name}";`).join("\n") +
    "\n",
);

await writeFile(
  join(outRoot, "index.ts"),
  `// Generated by scripts/generate-aasaam.mjs — do not edit.\n` +
    `export { aasaamCategory, aasaamManifest } from "./catalog";\n` +
    `export { data as aasaamIconData } from "./data";\n`,
);

const bytes = Buffer.byteLength(serialize(data));
flushComponentRegistry();
console.log(`Generated ${icons.length} aasaam icons`);
console.log(`Icon data JSON ~${(bytes / 1024 / 1024).toFixed(2)} MB`);
console.log(`Output: ${outRoot}`);
