import { useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ReferenceLine
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ══ WEBHOOKS ════════════════════════════════════════════════════════════════
const WEBHOOK_SHEETS     = "https://hook.eu1.make.com/mvkyqewrwl5dqkpas3q7n6dkaujrlyjr";
const WEBHOOK_SEND_CODE  = "https://hook.eu1.make.com/wx9ax6kfm69gfgc13k85ttk46yc5hbqf";
const WEBHOOK_CHECK_CODE = "https://hook.eu1.make.com/8rfm5s2uyj7x9frfh33bbvmflejqps8m";
const WEBHOOK_NOTIFY     = "REMPLACER_PAR_WEBHOOK_NOTIFICATION_MAKE"; // À créer Make Scénario 5
const WORKER_AI_URL      = "https://sc-maturity-ai.jbfleck.workers.dev";

// ══ COULEURS LOGO ════════════════════════════════════════════════════════════
const C1 = "#0C2F72"; // bleu marine (principal)
const C2 = "#4472C4"; // bleu vif (accent)

// ══ LOGO BASE64 ══════════════════════════════════════════════════════════════
const LOGO_SRC = "data:image/png;base64,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";

// ══ VALIDATION EMAIL ═════════════════════════════════════════════════════════
const BLOCKED_DOMAINS = ["gmail.com","googlemail.com","hotmail.com","gmx.com","hotmail.fr","outlook.com","outlook.fr","live.com","live.fr","msn.com","yahoo.com","yahoo.fr","icloud.com","me.com","mac.com","laposte.net","orange.fr","sfr.fr","free.fr","wanadoo.fr","bbox.fr","numericable.fr","aol.com","protonmail.com","proton.me","tutanota.com","gmx.fr","mail.com","yandex.com","zoho.com","fastmail.com"];
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isProEmail = (e) => { const d = e.split("@")[1]?.toLowerCase(); return d && !BLOCKED_DOMAINS.includes(d); };

// ══ QUESTIONS ════════════════════════════════════════════════════════════════
const QUESTIONS = [
  { theme: "Stratégie Supply Chain", q: "Comment votre direction générale perçoit-elle la Supply Chain ?", options: [
    "La SC se limite au transport et à l'entrepôt, considérés comme de simples postes de coût",
    "La logistique est gérée en silos, sans lien avec la stratégie commerciale ou de production",
    "La SC est reconnue comme une fonction stratégique avec des objectifs de performance définis",
    "Plusieurs stratégies SC sont formalisées selon les segments produits/marchés avec des SLA clients et fournisseurs",
    "Une feuille de route SC digitale est déployée (EDI, IoT, SaaS, BI, automatisation) par canal de distribution",
    "L'entreprise est intégrée dans un écosystème collaboratif avec une visibilité end-to-end",
  ]},
  { theme: "Stratégie Supply Chain", q: "Quels moyens sont mis à disposition de la Supply Chain pour réaliser sa stratégie ?", options: [
    "Aucun moyen humain et financier spécifique n'est affecté à la Supply Chain",
    "Des ressources humaines sont mobilisées de manière ad hoc selon les urgences (alternants, CDD)",
    "Des collaborateurs sont identifiés sur chaque fonction de la supply chain avec un budget par fonction",
    "Une ou plusieurs stratégies SC sont définies selon la stratégie des opérations (MTS, MTO, ATO, ETO), les segments produits/marchés et les enjeux de l'entreprise. Un budget SC est formalisé et revu annuellement",
    "Un budget SC est défini avec des ROI mesurés par projet, permettant d'arbitrer les investissements. Le budget fait l'objet d'une revue périodique dans l'année",
    "Les investissements SC font l'objet d'un pilotage stratégique pluriannuel avec des ROI démontrés, contribuant à la performance globale et à une meilleure valorisation lors d'une éventuelle cession",
  ]},
  { theme: "Processus & Organisation", q: "Comment vos processus Supply Chain sont-ils documentés et maîtrisés ?", options: [
    "Les processus ne sont pas documentés, le savoir-faire repose uniquement sur les individus",
    "Certains processus sont documentés mais de manière incomplète et non maintenue à jour",
    "Les processus opérationnels sont documentés et à jour, mais les processus support et transverses ne sont pas couverts",
    "Une démarche BPMN est déployée (ou ISO 9001 engagée), incluant les processus support et transverses. Des responsables de processus et des KPIs sont définis sur les processus clés",
    "L'amélioration continue est intégrée : analyses de causes racines, mises à jour régulières et pilotage de la performance par processus",
    "Des projets de digitalisation et d'automatisation des processus sont engagés (RPA, workflows, IA, outils no-code) pour gagner en fiabilité et en efficience",
  ]},
  { theme: "Processus & Organisation", q: "Comment est organisée la fonction Supply Chain dans votre entreprise ?", options: [
    "Aucun responsable logistique ou SCM n'est identifié, les activités SC sont éclatées entre les fonctions",
    "Un responsable logistique ou SCM existe mais ne couvre pas l'ensemble des processus SC",
    "La fonction SC couvre les processus clés (appro, planification, service client, transport, logistique interne et externe) mais n'est pas représentée au CODIR",
    "Un(e) directeur(trice) SC siège au CODIR et couvre l'ensemble des processus : appro, planification, service client, transport, logistique interne et externe",
    "La fonction SC maîtrise ses master data, dispose d'un service méthodes logistiques avec des compétences en gestion de projet et pilote activement sa transformation",
    "L'entreprise benchmarke avec des pairs, adhère à des associations professionnelles pour identifier des gisements de gains, et collabore activement avec ses homologues chez les clients et fournisseurs",
  ]},
  { theme: "Approvisionnement & Achats", q: "Comment gérez-vous votre panel fournisseurs ?", options: [
    "Aucune gestion du panel, les fournisseurs sont choisis au cas par cas sans critères définis",
    "Des fournisseurs habituels existent mais sans évaluation ni contractualisation formelle",
    "Les fournisseurs sont référencés avec des critères de sélection et des contrats de base",
    "Le panel est structuré avec une segmentation fournisseurs, des évaluations régulières, un protocole fournisseur formalisé avec les plus importants, et des plans de progrès en partenariat avec le service achats",
    "Des partenariats stratégiques sont développés avec les fournisseurs clés. Des revues de performance fournisseurs sont co-animées en partenariat avec le service achats, avec des indicateurs partagés",
    "L'entreprise co-innove avec ses fournisseurs stratégiques et intègre des critères RSE dans la gestion du panel",
  ]},
  { theme: "Approvisionnement & Achats", q: "Comment pilotez-vous vos approvisionnements au quotidien ?", options: [
    "Les commandes sont passées en réaction aux ruptures, sans anticipation ni calcul de besoin",
    "Les approvisionnements reposent sur l'expérience des approvisionneurs sans méthode formalisée",
    "Les approvisionneurs réalisent des prévisions et s'appuient sur des paramètres de base (stocks mini, points de commande) mais ceux-ci sont rarement révisés",
    "Les besoins sont calculés via un CBN ou MRP. Les approvisionneurs utilisent plusieurs méthodes de passation de commande selon la fréquence et la quantité. Les paramètres sont suivis et mis à jour régulièrement",
    "Les approvisionnements sont optimisés via des outils avancés ; le portefeuille fournisseurs et les paramètres de gestion font l'objet d'une revue formelle à fréquence régulière, a minima tous les 3 mois",
    "Les flux d'approvisionnement sont synchronisés en temps réel avec les fournisseurs via une plateforme dédiée (GPA, EDI, VMI) offrant une visibilité end-to-end",
  ]},
  { theme: "Service Client", q: "Comment est géré le flux de commande client (Order to Cash) ?", options: [
    "Les commandes sont saisies manuellement sans processus défini ni accusé de réception systématique",
    "Les commandes sont saisies et confirmées par email mais sans vérification de disponibilité des stocks ni intégration avec la production",
    "Le module de gestion des commandes est intégré au SI, permettant un contrôle de disponibilité et une date d'engagement ferme (ATP/CTP)",
    "Le flux Order to Cash est maîtrisé par une équipe pluridisciplinaire (ADV, transport, entrepôt, planification) avec des KPIs de suivi",
    "Les commandes sont reçues et intégrées automatiquement via EDI ou API avec les clients, avec envoi sécurisé des AR et factures",
    "La Supply Chain pilote en temps réel la demande réelle des clients clés via des programmes collaboratifs (GPA/VMI) avec partage de données en continu, voire une démarche CPFR",
  ]},
  { theme: "Service Client", q: "Quel est le périmètre et le positionnement de votre ADV / Service Client ?", options: [
    "Aucune fonction ADV ou Service Client clairement identifiée, les commandes sont gérées par les commerciaux",
    "Une fonction ADV existe mais se limite à la saisie des commandes et à la facturation, sans lien avec la Supply Chain",
    "L'ADV gère le flux de commande (saisie, AR, facturation, litiges) mais le Service Client reste rattaché au commercial sans coordination SC",
    "L'ADV est intégrée à la Supply Chain (flux de commande) et le Service Client au commercial (relation client), avec un KPI commun de satisfaction client",
    "Le Service Client pilote les réclamations, les enquêtes de satisfaction, le reporting KPI et alimente une démarche d'amélioration continue en lien avec la SC",
    "Le Service Client gère des programmes collaboratifs (GPA/VMI) avec les clients clés et co-construit les offres de service sur la base de données partagées en temps réel",
  ]},
  { theme: "Gestion des stocks", q: "Comment définissez-vous et pilotez-vous votre politique de stocks ?", options: [
    "Les niveaux de stock sont déterminés au jugé ou en termes de couverture, sans technique d'optimisation ni cible définie. De nombreuses ruptures subites perturbent régulièrement l'activité",
    "Les niveaux de stock (mini/maxi, stocks de sécurité) sont dimensionnés sur la base de règles simples et empiriques",
    "Les paramètres de stock sont calculés (point de commande, stock de sécurité, MOQ) et une classification ABC est réalisée deux fois par an",
    "Les niveaux de stock sont optimisés par segment (ABC²) en fonction de la variabilité de la demande, des délais fournisseurs et des objectifs de service client, avec une revue trimestrielle. Une politique de stock est en place et suivie",
    "Toutes les méthodes de gestion de stock sont maîtrisées selon les segments (fréquence/quantité variable ou fixe). Le niveau de stock est sous contrôle en quantité et valeur en euros, en accord avec les objectifs du contrôle de gestion",
    "Des flux tirés sont mis en place sur certains segments de familles AA. Les encours sont réduits grâce à des méthodes comme le DBR ou le DDMRP. Les règles de gestion sont définies en collaboration avec les partenaires clés",
  ]},
  { theme: "Gestion des stocks", q: "Comment assurez-vous la fiabilité et la maîtrise de vos stocks ?", options: [
    "Il n'existe aucune procédure d'entrée et de sortie des produits dans les magasins. Les écarts sont nombreux et comptabilisés principalement lors de l'inventaire annuel. Les stocks sont suivis sur un tableur",
    "Une méthode de gestion des sorties est appliquée (FIFO, LIFO ou autre). Les écarts sont corrigés lors des prélèvements mais ne font pas l'objet d'une analyse de causes. Une part non négligeable de stock est obsolète. La précision des stocks n'est pas suivie",
    "L'accès au magasin est contrôlé, le personnel est formé. Des inventaires tournants sont effectués mais chaque référence n'est inventoriée qu'une à deux fois par an. La précision est supérieure à 95%, sans système de traçabilité (code-barres)",
    "Le stock informatique correspond au stock physique. Un système de traçabilité est en place (code-barres). Les inventaires tournants sont fréquents (précision > 98%) et des indicateurs clés sont suivis mensuellement (rotation, obsolescence, taux de remplissage, coût total)",
    "Des lecteurs codes-barres, datamatrix ou capteurs IoT fiabilisent les mouvements de stock. Les inventaires tournants sont systématiques sur les classes A et B (précision > 99,8%). Des alertes automatiques déclenchent des actions correctives en cas de dérive",
    "La visibilité complète des stocks en tous points du réseau permet de détecter immédiatement tout écart. Les inventaires tournants sont suffisamment fiables pour supprimer l'inventaire annuel, évitant toute interruption des réceptions et expéditions",
  ]},
  { theme: "Flux internes", q: "Comment sont organisés et pilotés vos flux internes ?", options: [
    "Les flux internes sont gérés par la production sans organisation logistique dédiée",
    "Un responsable logistique interne existe mais les flux sont subis, non anticipés et peu formalisés",
    "Les flux internes sont cartographiés et des règles de gestion sont définies (tournées, fréquences d'approvisionnement des lignes)",
    "Les flux internes sont pilotés par des systèmes de type kanban ou flux tirés, avec des indicateurs de suivi des approvisionnements de ligne",
    "Des gammes de manutention ou un outil dédié permettent d'optimiser les flux internes (séquencement, tournées, gestion des ressources)",
    "Les ressources de flux internes sont mutualisées entre les secteurs. Une démarche VSM est déployée pour identifier et éliminer les gaspillages et optimiser les flux de bout en bout",
  ]},
  { theme: "Flux internes", q: "Comment mesurez-vous et optimisez-vous la performance de vos flux internes ?", options: [
    "Aucun indicateur de performance, les flux ne sont pas visibles dans l'atelier et les dysfonctionnements sont traités au cas par cas",
    "Quelques mesures informelles existent (retards, ruptures de ligne) sans suivi structuré ni management visuel",
    "Des KPIs de base sont suivis et des outils de management visuel sont présents dans l'atelier (tableaux de bord, affichages) rendant les flux visibles pour les équipes",
    "Les KPIs sont formalisés et revus régulièrement en réunion d'équipe. Le management visuel est structuré (andon, flux matérialisés au sol) et les écarts font l'objet d'analyses de causes et de plans d'action",
    "Les déplacements sont suivis et tracés. Le management visuel est digital et intégré dans un tableau de bord SC global avec des alertes en cas de dérive",
    "Des algorithmes d'optimisation, un jumeau numérique et des équipements IoT embarqués permettent de piloter et simuler les flux en temps réel, couplés à une démarche d'amélioration continue (VSM, kaizen)",
  ]},
  { theme: "Logistique", q: "Comment est organisé et piloté votre entrepôt ? (stocks amont et aval, interne et externe)", options: [
    "Aucun système d'adressage, les produits sont entreposés sans organisation. La gestion des stocks repose sur des fichiers Excel. L'entrepôt est encombré et les allées obstruées",
    "L'entrepôt est rangé et propre, les flux entrée/sortie sont séparés. L'ERP est utilisé pour la gestion des stocks avec des fonctionnalités limitées (adressage fixe, mouvements de base)",
    "Le zonage est cartographié, des solutions de stockage dynamique sont en place. L'ERP couvre les fonctions essentielles (inventaire, préparation de commande, expédition et transport) de manière simplifiée et sans lien avec l'extérieur. Une démarche d'amélioration continue est engagée",
    "Un WMS intégré au SI gère le multi-emplacements, l'ordonnancement des préparations, l'optimisation des chemins, le pré-colisage et les étiquettes logistiques. La prise de rendez-vous est digitalisée",
    "Des installations automatisées sont déployées (transstockeurs, shuttles, AGV, robots) lorsque nécessaire. Des liens EDI sont établis avec les partenaires clés. Les équipements font l'objet d'une maintenance préventive et prédictive",
    "Les prévisions issues du processus S&OP sont transformées en besoins logistiques anticipés pour optimiser les ressources et l'espace. L'entrepôt est piloté via des interfaces multiples avec tous les acteurs de la chaîne",
  ]},
  { theme: "Logistique", q: "Comment mesurez-vous et améliorez-vous la performance de votre entrepôt ?", options: [
    "Aucune mesure d'efficacité des opérations (réception, stockage, préparation, expédition)",
    "La performance est mesurée uniquement en termes de productivité et d'erreurs de préparation. La polyvalence informelle du personnel est mise à profit",
    "Plusieurs ratios sont suivis : lignes préparées/jour/personne, taux de commandes expédiées complètes à la date promise sans erreur, utilisation des quais",
    "Un tableau de bord complet est suivi régulièrement : taux de service, temps de préparation, fiabilité, productivité, taux de remplissage, coûts. Les écarts font l'objet de plans d'amélioration continue",
    "Le contrôle de conformité des flux entrants et sortants est automatisé (caméras, portiques RFID) ou via l'intégration des ordres d'achat lors de la réception. Les indicateurs sont calculés en temps réel avec des alertes correctives",
    "La connaissance en temps réel des statuts de préparation et de livraison sur l'ensemble du réseau permet d'anticiper tout événement et d'optimiser les opérations avec l'ensemble des partenaires SC",
  ]},
  { theme: "Transport", q: "Comment organisez-vous et pilotez-vous votre transport ?", options: [
    "Aucune organisation transport définie, les expéditions sont gérées au cas par cas sans prestataire attitré ni cahier des charges",
    "Des transporteurs habituels sont utilisés mais sans contrat formalisé, ni optimisation des tournées ou des chargements",
    "Des contrats transport sont en place, les prestataires sont sélectionnés sur des critères définis (coût, délai, qualité). Les expéditions sont planifiées mais sans outil dédié",
    "Un TMS ou un outil de gestion transport est déployé, permettant la planification des réceptions, des tournées, des expéditions et le suivi avec des statuts de transport",
    "Les échanges avec les transporteurs sont automatisés (EDI, API). Les données transport sont intégrées au SI pour une visibilité complète des flux et une facturation contrôlée automatiquement",
    "Les prévisions issues du processus S&OP sont transformées en besoins transport anticipés. L'entreprise participe à des programmes de mutualisation du transport dans une démarche RSE active",
  ]},
  { theme: "Transport", q: "Comment mesurez-vous et optimisez-vous la performance de votre transport ?", options: [
    "Aucun indicateur transport suivi, les litiges et retards sont gérés au cas par cas",
    "Quelques indicateurs informels existent (retards, litiges) sans suivi structuré ni revue avec les transporteurs",
    "Les KPIs de base sont suivis (taux de livraison à l'heure, taux de litiges, coût/km ou coût/colis) et partagés avec les transporteurs lors de revues périodiques",
    "Un tableau de bord transport est formalisé et revu a minima tous les mois. Chaque retard est tracé et une cause racine est systématiquement assignée. Les plans d'amélioration sont suivis avec les prestataires",
    "La performance transport est pilotée en temps réel avec des alertes automatiques. Les émissions de CO2 sont disponibles et intégrées dans les critères de décision. Des revues de performance sont réalisées avec les principaux transporteurs",
    "Les indicateurs transport sont partagés avec tous les transporteurs. L'optimisation est continue grâce à des algorithmes de planification intégrant contraintes capacitaires, délais, coûts et empreinte carbone",
  ]},
  { theme: "Système d'Information", q: "Quel est le niveau de maturité et d'intégration de votre SI Supply Chain ?", options: [
    "Aucun outil de gestion, les données sont gérées sur papier ou via des fichiers Excel non partagés",
    "Un ERP basique est en place mais utilisé partiellement. Les commandes achat et les commandes clients sont ressaisies manuellement dans l'ERP",
    "L'ERP couvre les principales fonctions SC (commandes, stocks, achats, production) avec des données centralisées et quelques initiatives d'intégration des commandes clients",
    "Le SI est intégré et couvre l'ensemble des processus SC. Des outils spécialisés (WMS, TMS, APS) communiquent avec l'ERP, évitant les ressaisies. Les commandes clients sont majoritairement intégrées automatiquement. Les commandes fournisseurs sont envoyées de manière digitalisée",
    "Le SI est connecté avec les partenaires clés via EDI ou API. Les master data sont maîtrisées et gouvernées. Un référentiel de données unique est en place",
    "Le SI est ouvert et interopérable avec l'ensemble de l'écosystème (clients, fournisseurs, transporteurs, prestataires) via des interfaces standardisées en temps réel",
  ]},
  { theme: "Système d'Information", q: "Comment utilisez-vous les données pour piloter et améliorer votre Supply Chain ?", options: [
    "Aucun tableau de bord ni indicateur, les décisions se prennent sans données fiables",
    "Quelques indicateurs sont produits manuellement via Excel, sans automatisation ni fiabilité garantie",
    "Des tableaux de bord sont en place avec des KPIs SC de base, alimentés automatiquement par l'ERP",
    "Un outil de BI est déployé, les données sont consolidées et analysées pour piloter la performance SC et alimenter les prises de décision",
    "Les écarts avec les niveaux de performance sont tracés et des causes racines sont identifiées pour l'amélioration continue. Des algorithmes prédictifs et du machine learning sont utilisés pour anticiper la demande et optimiser les stocks",
    "L'IA et le Big Data permettent un pilotage en temps réel de la SC via une Control Tower offrant une visibilité end-to-end, des capacités d'auto-apprentissage et de recommandation automatique",
  ]},
];

const THEMES = [...new Set(QUESTIONS.map(q => q.theme))];

// ══ NIVEAUX DE MATURITÉ ══════════════════════════════════════════════════════
const MATURITY_LEVELS = [
  {
    level: 0,
    label: "Implicite",
    color: "#dc2626",
    desc: "Aucun processus formalisé. Gestion individuelle, réactive, en silos.",
    detail: "La Supply Chain repose sur l'expérience individuelle et les habitudes locales. Les décisions sont prises au cas par cas, en réaction aux urgences. Les dysfonctionnements sont acceptés comme une fatalité.",
    keywords: "Non formalisé · Réactif · Silos · Absence de stratégie",
  },
  {
    level: 1,
    label: "Formalisée",
    color: "#ea580c",
    desc: "Processus documentés par fonction, mais cloisonnés.",
    detail: "Les processus commencent à être formalisés par fonction (achats, production, logistique) par nécessité. La documentation existe mais reste cloisonnée. Les KPIs locaux sont suivis sans analyse globale.",
    keywords: "Processus documentés · Silos persistants · KPIs locaux · Réactivité",
  },
  {
    level: 2,
    label: "Maîtrisée",
    color: "#d97706",
    desc: "Processus alignés sur la stratégie globale, début de collaboration.",
    detail: "Tous les processus sont formalisés et alignés sur une stratégie globale. L'entreprise cherche à stabiliser ses opérations. Un responsable SC est nommé. Les silos commencent à s'atténuer.",
    keywords: "Processus alignés · KPIs transverses · Stabilisation · Outils centralisés",
  },
  {
    level: 3,
    label: "Intégrée",
    color: "#65a30d",
    desc: "Vision globale, S&OP déployé, collaboration systématique.",
    detail: "Toutes les fonctions SC travaillent ensemble. Un S&OP synchronise demande et offre. La collaboration est systématique en interne et avec les partenaires. Les outils ERP/WMS/TMS sont intégrés.",
    keywords: "Collaboration systématique · S&OP · Vision globale · Intégration des outils",
  },
  {
    level: 4,
    label: "Améliorée",
    color: "#16a34a",
    desc: "Amélioration continue, décisions data-driven, centre d'excellence.",
    detail: "L'entreprise intègre l'amélioration continue dans sa culture SC. Les processus sont optimisés via Lean, Six Sigma, DDMRP. Les décisions sont data-driven. Un centre d'excellence SC capitalise les bonnes pratiques.",
    keywords: "Amélioration continue · Data-driven · Lean/Six Sigma · Centre d'excellence",
  },
  {
    level: 5,
    label: "Optimisée",
    color: "#0d9488",
    desc: "Centre de profit différenciant, IA/IoT, visibilité end-to-end.",
    detail: "La SC est perçue comme un centre de profit différenciant. Les technologies avancées (IA, IoT, blockchain) sont intégrées. Les processus sont auto-optimisés. Les services logistiques sont monétisés.",
    keywords: "Centre de profit · IA/IoT/Blockchain · Visibilité end-to-end · Monétisation",
  },
];

const getLevel = (s) => MATURITY_LEVELS.find(l => l.level === Math.min(Math.round(s), 5)) || MATURITY_LEVELS[0];

// ══ COMPOSANTS ═══════════════════════════════════════════════════════════════
const Logo = () => (
  <img src={LOGO_SRC} alt="Aravis Performance" style={{ height: 52, objectFit: "contain" }} />
);

const Header = () => (
  <div style={{ background: "#fff", borderBottom: `3px solid ${C1}`, padding: "10px 28px", marginBottom: 28 }}>
    <Logo />
  </div>
);

const ProgressBar = ({ pct }) => (
  <div style={{ marginBottom: 28 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginBottom: 6 }}>
      <span>Progression</span><span>{pct}%</span>
    </div>
    <div style={{ background: "#e2e8f0", height: 5, borderRadius: 99 }}>
      <div style={{ background: C1, height: "100%", width: `${pct}%`, borderRadius: 99, transition: "width 0.4s ease" }} />
    </div>
  </div>
);

const card = { background: "#fff", borderRadius: 16, padding: 40, boxShadow: "0 4px 24px #0001", maxWidth: 680, width: "100%", margin: "0 auto" };
const btn = (active) => ({
  background: active ? C1 : "#94a3b8",
  color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px",
  fontSize: 15, fontWeight: 600, cursor: active ? "pointer" : "not-allowed", width: "100%",
});

// ══ APP ══════════════════════════════════════════════════════════════════════
export default function App() {
  const [step, setStep]             = useState("intro");
  const [answers, setAnswers]       = useState({});
  const [current, setCurrent]       = useState(0);
  const [form, setForm]             = useState({ prenom: "", nom: "", email: "", entreprise: "" });
  const [emailErr, setEmailErr]     = useState("");
  const [codeInput, setCodeInput]   = useState("");
  const [codeErr, setCodeErr]       = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [aiComment, setAiComment]   = useState("");
  const [loading, setLoading]       = useState(false);
  const [sheetStatus, setSheetStatus] = useState("idle");
  const [contactPref, setContactPref] = useState({ none: false, phone: false, email: false });
  const [phoneNumber, setPhoneNumber] = useState("");

  const contactSelected = contactPref.none || contactPref.phone || contactPref.email;

  const handleContactChange = (key) => {
    if (key === "none") {
      setContactPref({ none: true, phone: false, email: false });
    } else {
      setContactPref(prev => ({ ...prev, none: false, [key]: !prev[key] }));
    }
  };

  const qScore = (i) => answers[i] ?? 0;

  const themeScore = (theme) => {
    const idxs = QUESTIONS.map((q, i) => q.theme === theme ? i : -1).filter(i => i >= 0);
    const avg = idxs.reduce((a, i) => a + qScore(i), 0) / idxs.length;
    return Math.round(avg * 10) / 10;
  };

  const avgScore = Math.round(THEMES.reduce((a, t) => a + themeScore(t), 0) / THEMES.length * 10) / 10;
  const level = getLevel(avgScore);

  const radarData = THEMES.map(t => ({
    theme: t.length > 13 ? t.substring(0, 12) + "…" : t,
    fullTheme: t,
    score: themeScore(t),
    fullMark: 5,
  }));

  const handleAnswer = (score) => {
    const na = { ...answers, [current]: score };
    setAnswers(na);
    current < QUESTIONS.length - 1 ? setCurrent(current + 1) : setStep("form");
  };

  const handleFormSubmit = async () => {
    setEmailErr("");
    if (!validEmail(form.email)) { setEmailErr("Veuillez saisir un email valide."); return; }
    if (!isProEmail(form.email)) { setEmailErr("Merci de saisir votre email professionnel (Gmail, Hotmail, Yahoo et autres messageries personnelles non acceptées)."); return; }
    setCodeSending(true);
    try {
      await fetch(WEBHOOK_SEND_CODE, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ email: form.email, prenom: form.prenom }),
      });
      setStep("email_verify");
      generateComment();
    } catch {
      setEmailErr("Erreur lors de l'envoi du code. Veuillez réessayer.");
    }
    setCodeSending(false);
  };

  const handleVerifyCode = async () => {
    setCodeErr("");
    try {
      await fetch(WEBHOOK_CHECK_CODE, {
        method: "POST", mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({ email: form.email, code: codeInput.trim() }),
      });
      setStep("result");
    } catch {
      setCodeErr("Erreur de vérification. Veuillez réessayer.");
    }
  };

  const generateComment = async () => {
    setLoading(true);
    const ctx = THEMES.map(t => `${t} : ${themeScore(t)}/5`).join(", ");
    const prompt = `Tu es Jean-Baptiste Fleck, consultant expert en supply chain et lean manufacturing, fondateur d'Aravis Performance, cabinet conseil certifié Qualiopi, fort de 25 années d'expérience et de plus de 20 audits-diagnostics réalisés.

Un dirigeant de PME industrielle vient de réaliser une auto-évaluation de la maturité de sa supply chain.
Résultats par thématique : ${ctx}
Score global : ${avgScore}/5 — Niveau : ${level.label} — ${level.desc}

Rédige une analyse structurée en EXACTEMENT 2 paragraphes.
RÈGLES STRICTES :
- Chaque phrase fait MAXIMUM 15 mots.
- Reviens à la ligne après CHAQUE phrase.
- Prose uniquement, pas de bullet points.
- Ton direct, expert et bienveillant.
- MAXIMUM 400 mots au total.

PARAGRAPHE 1 — Points forts :
Identifie les 2 ou 3 thématiques avec les meilleurs scores.
Valorise ce qui fonctionne bien de façon concrète.

PARAGRAPHE 2 — Axes de progrès prioritaires :
Identifie les 2 ou 3 thématiques avec les scores les plus faibles.
Propose une ou deux pistes d'amélioration concrètes.
Rappelle que cette auto-évaluation est indicative.
Précise qu'un audit complet contextualise les résultats à la stratégie et au marché.
Invite chaleureusement à contacter Aravis Performance pour un audit complet ou ciblé.`;

    try {
      const res = await fetch(WORKER_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`Worker error: ${res.status}`);
      const data = await res.json();
      setAiComment(data.comment || "Commentaire indisponible.");
    } catch {
      setAiComment("Erreur lors de la génération du commentaire.");
    }
    setLoading(false);
  };

  const sendToSheets = async (comment) => {
    if (!WEBHOOK_SHEETS || WEBHOOK_SHEETS.startsWith("REMPLACER")) { setSheetStatus("error"); return; }
    setSheetStatus("sending");
    const payload = {
      date: new Date().toLocaleString("fr-FR"),
      prenom: form.prenom,
      nom: form.nom,
      entreprise: form.entreprise,
      email: form.email,
      score_global: avgScore,
      niveau: level.label,
      recontact_non: contactPref.none ? "Oui" : "Non",
      recontact_tel: contactPref.phone ? "Oui" : "Non",
      recontact_telephone_numero: contactPref.phone ? phoneNumber : "",
      recontact_email: contactPref.email ? "Oui" : "Non",
      ...Object.fromEntries(QUESTIONS.flatMap((q, i) => {
        const key = `Q${i + 1}`;
        return [
          [`${key}_theme`, q.theme],
          [`${key}_reponse`, q.options[qScore(i)]],
          [`${key}_score`, qScore(i)],
        ];
      })),
      ...Object.fromEntries(THEMES.map(t => [`score_${t.replace(/[^a-zA-Z]/g, "_").toLowerCase()}`, themeScore(t)])),
      commentaire_ia: comment,
    };
    try {
      await fetch(WEBHOOK_SHEETS, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
      setSheetStatus("ok");
    } catch { setSheetStatus("error"); }
  };

  const sendNotification = async () => {
    if (!WEBHOOK_NOTIFY || WEBHOOK_NOTIFY.startsWith("REMPLACER")) return;
    const payload = {
      date: new Date().toLocaleString("fr-FR"),
      prenom: form.prenom,
      nom: form.nom,
      entreprise: form.entreprise,
      email: form.email,
      score_global: avgScore,
      niveau: level.label,
      recontact_tel: contactPref.phone ? "Oui" : "Non",
      telephone: contactPref.phone ? phoneNumber : "",
      recontact_email: contactPref.email ? "Oui" : "Non",
    };
    try {
      await fetch(WEBHOOK_NOTIFY, { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(payload) });
    } catch { /* silencieux */ }
  };

  const exportResult = async () => {
    // Envoi Sheets + notification avant export PDF
    await sendToSheets(aiComment);
    if (contactPref.phone || contactPref.email) {
      await sendNotification();
    }

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const blue = [12, 47, 114];
    const accent = [68, 114, 196];
    const dark = [15, 23, 42];
    const gray = [71, 85, 105];
    const lightBlue = [239, 246, 255];
    const pageW = 210;
    const margin = 20;

    doc.setFillColor(...blue);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFontSize(16); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("Aravis Performance", margin, 11);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(191, 219, 254);
    doc.text("Cabinet Conseil Supply Chain & Excellence Operationnelle", margin, 17);
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("Rapport de maturite Supply Chain", margin, 24);

    let y = 38;
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "F");
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
    doc.text(`${form.prenom} ${form.nom}`, margin + 4, y + 7);
    doc.setFont("helvetica", "normal"); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text(`${form.entreprise}  -  ${form.email}`, margin + 4, y + 13);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin + 4, y + 19);

    y += 30;
    doc.setFillColor(...blue);
    doc.roundedRect(margin, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, "F");
    doc.setFontSize(22); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text(`${avgScore}/5`, margin + 6, y + 14);
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(191, 219, 254);
    doc.text("Score global", margin + 6, y + 20);
    const levelX = margin + (pageW - margin * 2) / 2 + 4;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(levelX, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, "F");
    doc.setFontSize(14); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
    doc.text(level.label, levelX + 4, y + 12);
    doc.setFontSize(8); doc.setFont("helvetica", "normal"); doc.setTextColor(...gray);
    doc.text(level.desc, levelX + 4, y + 19);

    y += 30;
    doc.setFontSize(8); doc.setFont("helvetica", "italic"); doc.setTextColor(...gray);
    doc.text("Niveau de maturite donne a titre indicatif sur la base d'un nombre reduit d'informations et sans analyse du perimetre de la supply chain de votre entreprise.", margin, y);
    y += 8;

    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
    doc.text("Scores par thematique", margin, y); y += 4;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [["Thematique", "Score", "Niveau"]],
      body: THEMES.map(t => { const s = themeScore(t); const l = getLevel(s); return [t, `${s} / 5`, l.label]; }),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: blue, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 90 }, 1: { cellWidth: 25, halign: "center" }, 2: { cellWidth: 45, halign: "center" } },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...dark);
    doc.text("Detail des reponses", margin, y); y += 4;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [["#", "Thematique", "Reponse selectionnee", "Niv."]],
      body: QUESTIONS.map((q, i) => [`Q${i + 1}`, q.theme, q.options[qScore(i)], qScore(i)]),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: blue, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: { 0: { cellWidth: 10, halign: "center" }, 1: { cellWidth: 38 }, 2: { cellWidth: 105 }, 3: { cellWidth: 10, halign: "center" } },
    });

    y = doc.lastAutoTable.finalY + 10;
    if (y > 240) { doc.addPage(); y = 20; }
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 2, 2, "F");
    doc.setFontSize(11); doc.setFont("helvetica", "bold"); doc.setTextColor(...blue);
    doc.text("Analyse personnalisee", margin + 4, y + 5.5); y += 12;
    doc.setFontSize(9); doc.setFont("helvetica", "normal"); doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(aiComment, pageW - margin * 2);
    doc.text(lines, margin, y); y += lines.length * 5 + 10;

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(...blue);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
    doc.setFontSize(10); doc.setFont("helvetica", "bold"); doc.setTextColor(255, 255, 255);
    doc.text("Jean-Baptiste FLECK - Fondateur Aravis Performance", margin + 4, y + 8);
    doc.setFontSize(8.5); doc.setFont("helvetica", "normal"); doc.setTextColor(191, 219, 254);
    doc.text("07 64 54 01 58", margin + 4, y + 15);
    doc.text("jbfleck@aravisperformance.com", margin + 4, y + 21);
    doc.text("www.aravisperformance.com", margin + 80, y + 15);
    doc.text("Certifie QUALIOPI - Supply Chain Master", margin + 80, y + 21);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i); doc.setFontSize(7); doc.setTextColor(148, 163, 184);
      doc.text(`Page ${i} / ${pageCount}  -  Aravis Performance  -  Rapport confidentiel`, pageW / 2, 292, { align: "center" });
    }
    doc.save(`maturite-supply-chain-${form.entreprise.replace(/\s+/g, "-")}.pdf`);
  };

  // ══ INTRO ══════════════════════════════════════════════════════════════════
  if (step === "intro") return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header />
      <div style={{ padding: "0 24px 48px" }}>
        <div style={card}>
          {/* Titre principal */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: C1, marginBottom: 8, lineHeight: 1.2 }}>
              Auto-évaluation Supply Chain
            </h1>
            <p style={{ fontSize: 17, color: "#475569", fontWeight: 500 }}>
              Quel est le niveau de maturité de votre Supply Chain ?
            </p>
          </div>

          {/* Disclaimer principal */}
          <div style={{ background: "#eff6ff", borderLeft: `4px solid ${C1}`, borderRadius: "0 10px 10px 0", padding: "18px 20px", marginBottom: 20 }}>
            <p style={{ color: "#1e3a6e", fontSize: 14, lineHeight: 1.8, margin: 0 }}>
              Cette auto-évaluation vous permettra de répondre à des questions relatives à votre supply chain. À l'issue du questionnaire, vous disposerez d'un <strong>aperçu sur le niveau potentiel de maturité "Supply Chain" de votre entreprise à titre indicatif</strong>.
            </p>
            <p style={{ color: "#1e3a6e", fontSize: 14, lineHeight: 1.8, margin: "12px 0 0 0" }}>
              <strong>Ne prenez pas le résultat de ce questionnaire à la lettre.</strong> Un audit complet de votre supply chain conduit par un professionnel avec un regard extérieur reste nécessaire pour disposer d'une analyse rigoureuse, contextualisée à votre stratégie, votre marché, vos produits et votre organisation. Les audits supply chain disponibles sur le marché contiennent généralement <strong>entre 150 et 200 questions</strong>. Dans certains cas, un audit d'une seule fonction peut atteindre ce nombre — à titre d'exemple, notre audit du processus S&OP comprend plus de 200 questions.
            </p>
            <p style={{ color: "#1e3a6e", fontSize: 14, lineHeight: 1.8, margin: "12px 0 0 0" }}>
              À l'issue de ce questionnaire, vous disposerez d'une <strong>notation par chapitre</strong>, d'une <strong>notation globale</strong> et d'un <strong>commentaire de notre expert</strong>.
            </p>
          </div>

          {/* Info questionnaire */}
          <div style={{ background: "#f1f5f9", borderRadius: 10, padding: "12px 16px", marginBottom: 20, fontSize: 13, color: "#475569", display: "flex", gap: 10 }}>
            <span style={{ fontSize: 18 }}>📋</span>
            <span>Ce questionnaire comporte <strong>18 questions structurantes</strong> réparties sur <strong>9 thématiques</strong> couvrant l'ensemble de votre supply chain. Comptez <strong>10 à 15 minutes</strong> pour y répondre avec attention.</span>
          </div>

          {/* Avertissement audit */}
          <div style={{ background: "#fff7ed", borderLeft: "4px solid #ea580c", borderRadius: "0 10px 10px 0", padding: "12px 18px", marginBottom: 28 }}>
            <p style={{ color: "#9a3412", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              ⚠️ <strong>Important :</strong> le diagnostic et la feuille de route ne font pas partie de cette auto-évaluation. Ils nécessitent l'intervention d'un expert en situation réelle.
            </p>
          </div>

          {/* Niveaux de maturité */}
          <div style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: C1, marginBottom: 14 }}>Les 6 niveaux de maturité Supply Chain</h2>
            {MATURITY_LEVELS.map(l => (
              <div key={l.level} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "12px 14px", borderRadius: 10, background: "#f8fafc", border: `1px solid #e2e8f0`, marginBottom: 8 }}>
                <div style={{ minWidth: 32, height: 32, borderRadius: 99, background: l.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, fontSize: 14, flexShrink: 0, marginTop: 2 }}>
                  {l.level}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a" }}>{l.label}</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, marginTop: 2 }}>{l.detail}</div>
                  <div style={{ fontSize: 11, color: l.color, fontWeight: 600, marginTop: 4 }}>{l.keywords}</div>
                </div>
              </div>
            ))}
          </div>

          <button style={btn(true)} onClick={() => setStep("quiz")}>Démarrer l'auto-évaluation →</button>
        </div>
      </div>
    </div>
  );

  // ══ QUIZ ═══════════════════════════════════════════════════════════════════
  if (step === "quiz") {
    const q = QUESTIONS[current];
    const pct = Math.round(((current + 1) / QUESTIONS.length) * 100);
    const themeIdx = THEMES.indexOf(q.theme);
    const themeColors = [C1, C2, "#7c3aed", "#0891b2", "#059669", "#d97706", "#ea580c", "#dc2626", "#6b21a8"];
    const tc = themeColors[themeIdx] || C1;
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Header />
        <div style={{ padding: "0 24px 48px" }}>
          <div style={card}>
            <ProgressBar pct={pct} />
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: tc, textTransform: "uppercase", letterSpacing: 1, background: `${tc}15`, padding: "4px 10px", borderRadius: 99 }}>{q.theme}</div>
              <span style={{ fontSize: 12, color: "#94a3b8" }}>Question {current + 1} / {QUESTIONS.length}</span>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 600, color: "#0f172a", marginBottom: 28, lineHeight: 1.5, marginTop: 16 }}>{q.q}</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {q.options.map((opt, i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  style={{ background: answers[current] === i ? `${tc}10` : "#f8fafc", border: `2px solid ${answers[current] === i ? tc : "#e2e8f0"}`, borderRadius: 10, padding: "12px 16px", textAlign: "left", fontSize: 13, color: "#334155", cursor: "pointer", lineHeight: 1.6, display: "flex", gap: 10, alignItems: "flex-start" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = tc; e.currentTarget.style.background = `${tc}10`; }}
                  onMouseLeave={e => { if (answers[current] !== i) { e.currentTarget.style.borderColor = "#e2e8f0"; e.currentTarget.style.background = "#f8fafc"; } }}>
                  <span style={{ minWidth: 22, height: 22, borderRadius: 99, background: answers[current] === i ? tc : "#e2e8f0", color: answers[current] === i ? "#fff" : "#64748b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              {current > 0 && <button onClick={() => setCurrent(current - 1)} style={{ background: "#f1f5f9", color: "#475569", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 1 }}>← Précédent</button>}
              {answers[current] !== undefined && (
                <button onClick={() => current < QUESTIONS.length - 1 ? setCurrent(current + 1) : setStep("form")}
                  style={{ background: tc, color: "#fff", border: "none", borderRadius: 8, padding: "12px 20px", fontSize: 14, fontWeight: 600, cursor: "pointer", flex: 2 }}>
                  {current < QUESTIONS.length - 1 ? "Suivant →" : "Voir mes résultats →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ FORM ═══════════════════════════════════════════════════════════════════
  if (step === "form") return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header />
      <div style={{ padding: "0 24px 48px" }}>
        <div style={{ ...card, maxWidth: 500 }}>
          <ProgressBar pct={100} />
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Vos coordonnées</h2>
          <p style={{ color: "#64748b", marginBottom: 24, fontSize: 14, lineHeight: 1.7 }}>Un code de vérification vous sera envoyé par email pour accéder à votre rapport personnalisé.</p>
          {[
            { key: "prenom", label: "Prénom *", type: "text" },
            { key: "nom", label: "Nom *", type: "text" },
            { key: "entreprise", label: "Entreprise *", type: "text" },
            { key: "email", label: "Email professionnel *", type: "email" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 13, fontWeight: 600, color: "#374151", display: "block", marginBottom: 5 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                style={{ width: "100%", border: `2px solid ${f.key === "email" && emailErr ? "#dc2626" : "#e2e8f0"}`, borderRadius: 8, padding: "10px 14px", fontSize: 14, outline: "none", boxSizing: "border-box" }} />
            </div>
          ))}
          {emailErr && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>⚠️ {emailErr}</div>}
          <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 18 }}>* Champs obligatoires. Données utilisées uniquement dans le cadre de cette auto-évaluation.</p>
          <button style={btn(!!(form.prenom && form.nom && form.email && form.entreprise) && !codeSending)}
            onClick={handleFormSubmit} disabled={!(form.prenom && form.nom && form.email && form.entreprise) || codeSending}>
            {codeSending ? "⏳ Envoi en cours…" : "Recevoir mon code de vérification →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ══ EMAIL VERIFY ══════════════════════════════════════════════════════════
  if (step === "email_verify") return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header />
      <div style={{ padding: "0 24px 48px" }}>
        <div style={{ ...card, maxWidth: 480, textAlign: "center" }}>
          <div style={{ fontSize: 52, marginBottom: 16 }}>📧</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 10 }}>Vérifiez votre email</h2>
          <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.7, marginBottom: 24 }}>
            Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.<br />Saisissez-le ci-dessous pour accéder à votre rapport.
          </p>
          <input type="text" maxLength={6} value={codeInput}
            onChange={e => { setCodeInput(e.target.value.replace(/\D/g, "")); setCodeErr(""); }}
            placeholder="_ _ _ _ _ _"
            style={{ width: "100%", border: `2px solid ${codeErr ? "#dc2626" : "#e2e8f0"}`, borderRadius: 10, padding: "14px", fontSize: 24, textAlign: "center", letterSpacing: 10, outline: "none", boxSizing: "border-box", marginBottom: 12, fontWeight: 700 }} />
          {codeErr && <div style={{ color: "#dc2626", fontSize: 13, marginBottom: 12, padding: "8px 12px", background: "#fef2f2", borderRadius: 6 }}>⚠️ {codeErr}</div>}
          <button style={btn(codeInput.length === 6)} onClick={handleVerifyCode} disabled={codeInput.length !== 6}>
            Valider et accéder à mon rapport →
          </button>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 14 }}>
            Pas reçu le code ? <span style={{ color: C1, cursor: "pointer" }} onClick={() => setStep("form")}>Modifier mon email</span>
          </p>
        </div>
      </div>
    </div>
  );

  // ══ RESULT ════════════════════════════════════════════════════════════════
  const barData = [...THEMES.map(t => ({ theme: t, score: themeScore(t) }))].sort((a, b) => a.score - b.score);

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <Header />
      <div style={{ maxWidth: 760, margin: "0 auto", padding: "0 16px 56px" }}>

        {sheetStatus === "sending" && <div style={{ background: "#eff6ff", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: C1 }}>📤 Enregistrement en cours…</div>}
        {sheetStatus === "ok"      && <div style={{ background: "#f0fdf4", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#16a34a" }}>✅ Résultats enregistrés.</div>}
        {sheetStatus === "error"   && <div style={{ background: "#fff7ed", borderRadius: 10, padding: "10px 16px", marginBottom: 16, fontSize: 13, color: "#ea580c" }}>⚠️ Erreur d'enregistrement — vérifiez la configuration Make.</div>}

        {/* Score global */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px #0001", marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 13, color: "#64748b", marginBottom: 6 }}>Résultats pour <strong>{form.prenom} {form.nom}</strong> — {form.entreprise}</div>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", marginBottom: 8 }}>Maturité Supply Chain</h1>
          <p style={{ fontSize: 12, color: "#94a3b8", fontStyle: "italic", marginBottom: 16 }}>
            Niveau de maturité donné à titre indicatif sur la base d'un nombre réduit d'informations et sans analyse du périmètre de la supply chain de votre entreprise.
          </p>
          <div style={{ display: "inline-block", background: level.color, color: "#fff", borderRadius: 99, padding: "10px 28px", fontSize: 20, fontWeight: 700, marginBottom: 12 }}>
            Niveau {avgScore}/5 — {level.label}
          </div>
          <p style={{ color: "#64748b", fontSize: 14, margin: 0, lineHeight: 1.7 }}>{level.detail}</p>
        </div>

        {/* Niveaux */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 18 }}>Les 6 niveaux de maturité Supply Chain</h2>
          {MATURITY_LEVELS.map(l => (
            <div key={l.level} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "10px 14px", borderRadius: 8, background: Math.round(avgScore) === l.level ? `${l.color}18` : "#f8fafc", border: `2px solid ${Math.round(avgScore) === l.level ? l.color : "transparent"}`, marginBottom: 8 }}>
              <div style={{ minWidth: 28, height: 28, borderRadius: 99, background: l.color, color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, flexShrink: 0, marginTop: 2 }}>{l.level}</div>
              <div>
                <span style={{ fontWeight: 700, fontSize: 13, color: "#0f172a" }}>{l.label}</span>
                {Math.round(avgScore) === l.level && <span style={{ fontSize: 12, color: l.color, fontWeight: 600, marginLeft: 8 }}>← Votre niveau</span>}
                <div style={{ fontSize: 12, color: "#64748b", marginTop: 2 }}>{l.detail}</div>
                <div style={{ fontSize: 11, color: l.color, fontWeight: 600, marginTop: 4 }}>{l.keywords}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 20, textAlign: "center" }}>Radar par thématique</h2>
          <ResponsiveContainer width="100%" height={460}>
            <RadarChart data={radarData} margin={{ top: 40, right: 80, bottom: 40, left: 80 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={(props) => {
                const { x, y, cx, cy, payload } = props;
                const words = payload.value.split(" ");
                const lines = [];
                let curr = "";
                words.forEach(w => {
                  if ((curr + " " + w).trim().length > 10) {
                    if (curr) lines.push(curr);
                    curr = w;
                  } else {
                    curr = (curr + " " + w).trim();
                  }
                });
                if (curr) lines.push(curr);
                const anchor = Math.abs(x - cx) < 10 ? "middle" : x > cx ? "start" : "end";
                return (
                  <text x={x} y={y} textAnchor={anchor} fill="#0f172a" fontSize={11} fontWeight={600}>
                    {lines.map((line, i) => (
                      <tspan key={i} x={x} dy={i === 0 ? `-${(lines.length - 1) * 8}` : "16"}>{line}</tspan>
                    ))}
                  </text>
                );
              }} />
              <PolarRadiusAxis angle={30} domain={[0, 5]} tick={{ fontSize: 9 }} tickCount={6} />
              <Radar name="Score" dataKey="score" stroke={C1} fill={C1} fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Histogramme */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 20, textAlign: "center" }}>Scores par thématique</h2>
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={barData} layout="vertical" margin={{ top: 0, right: 60, bottom: 0, left: 140 }}>
              <XAxis type="number" domain={[0, 5]} tickCount={6} tick={{ fontSize: 10 }} />
              <YAxis type="category" dataKey="theme" tick={{ fontSize: 11, fill: "#475569" }} width={135} />
              <Tooltip formatter={(v) => [`${v}/5`, "Score"]} />
              <ReferenceLine x={avgScore} stroke={C1} strokeDasharray="4 3" strokeWidth={2}
                label={{ value: `Moyenne : ${avgScore}`, position: "right", fontSize: 11, fill: C1, fontWeight: 700 }} />
              <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                {barData.map((entry, i) => (
                  <Cell key={i} fill={getLevel(entry.score).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginTop: 16 }}>
            {MATURITY_LEVELS.map(l => (
              <div key={l.level} style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, color: "#475569" }}>
                <div style={{ width: 12, height: 12, borderRadius: 3, background: l.color }} />
                {l.level} — {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Analyse IA */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 32, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Analyse personnalisée</h2>
          {loading
            ? <div style={{ color: "#64748b", fontStyle: "italic", textAlign: "center", padding: 32 }}>⏳ Génération de votre analyse en cours…</div>
            : <p style={{ color: "#334155", lineHeight: 2, fontSize: 14, margin: 0, whiteSpace: "pre-line" }}>{aiComment}</p>}
        </div>

        {/* Audit info */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 14 }}>Qu'est-ce qu'un audit supply chain ?</h2>
          <p style={{ color: "#475569", fontSize: 14, lineHeight: 1.9, marginBottom: 14 }}>
            Pour un audit en situation réelle, il faut compter <strong>entre 1 et 10 jours selon la taille de l'entreprise</strong>, y compris pour une PME. L'expert réalise l'audit-diagnostic et construit la feuille de route, restituée au <strong>CODIR de l'entreprise</strong> afin de s'emparer des enjeux supply chain au sein de l'organisation.
          </p>
          <div style={{ background: "#fefce8", borderLeft: "4px solid #ca8a04", borderRadius: "0 10px 10px 0", padding: "14px 18px" }}>
            <p style={{ color: "#713f12", fontSize: 13, lineHeight: 1.8, margin: 0 }}>
              <strong>⚖️ Indépendance et impartialité de l'auditeur</strong><br />
              Un auditeur est indépendant et réalise sa mission en toute impartialité. <strong>L'auditeur ne propose pas ses services pour la mise en œuvre de la feuille de route</strong> afin d'éviter tout conflit d'intérêt. Il peut en revanche <strong>orienter l'entreprise vers des experts spécialisés</strong> en fonction des sujets identifiés lors de l'audit.
            </p>
          </div>
        </div>

        {/* Profil JBF */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px #0001", marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 18 }}>Votre interlocuteur</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 20, padding: "14px 18px", background: "#eff6ff", borderRadius: 10 }}>
            <div style={{ width: 52, height: 52, background: C1, borderRadius: 99, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ color: "#fff", fontWeight: 800, fontSize: 15 }}>JBF</span>
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#0f172a" }}>Jean-Baptiste FLECK</div>
              <div style={{ fontSize: 12, color: "#64748b" }}>Fondateur — Aravis Performance · Certifié QUALIOPI</div>
            </div>
          </div>
          {[
            { icon: "⭐", text: "25 années d'expérience en Supply Chain & Excellence Opérationnelle" },
            { icon: "🔍", text: "Plus de 20 audits-diagnostics menés au cours des 5 dernières années" },
            { icon: "🏅", text: "Auditeur certifié France Supply Chain & Supply Chain Master" },
            { icon: "📋", text: "Maîtrise des référentiels MMOG/LE et Supply Chain Plus" },
            { icon: "🥋", text: "Black Belt Lean 6 Sigma" },
            { icon: "🎓", text: "CPIM — Certified in Planning and Inventory Management" },
          ].map((item, i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", padding: "11px 14px", background: i % 2 === 0 ? "#f8fafc" : "#fff", borderRadius: 8, fontSize: 14, color: "#1e293b", lineHeight: 1.5, marginBottom: 6, border: "1px solid #e2e8f0" }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background: C1, borderRadius: 16, padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#fff", marginBottom: 8 }}>Envie d'aller plus loin ?</h2>
          <p style={{ color: "#bfdbfe", fontSize: 14, lineHeight: 1.7, marginBottom: 20 }}>
            Contactez Jean-Baptiste FLECK pour un audit supply chain complet ou ciblé sur une fonction prioritaire. Ensemble, construisons une feuille de route de transformation adaptée à votre entreprise.
          </p>
          <div style={{ background: "rgba(255,255,255,0.15)", borderRadius: 10, padding: "16px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              { icon: "📞", val: "07 64 54 01 58" },
              { icon: "✉️", val: "jbfleck@aravisperformance.com" },
              { icon: "🌐", val: "www.aravisperformance.com" },
            ].map((c, i) => (
              <div key={i} style={{ fontSize: 14, color: "#e0f2fe", display: "flex", gap: 10, alignItems: "center" }}>
                <span style={{ fontSize: 16 }}>{c.icon}</span><span>{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recontact + Export */}
        <div style={{ background: "#fff", borderRadius: 16, padding: 28, boxShadow: "0 4px 24px #0001" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: "#0f172a", marginBottom: 16 }}>Télécharger mon rapport</h2>

          <div style={{ background: "#f8fafc", borderRadius: 10, padding: "16px 20px", marginBottom: 20 }}>
            <p style={{ fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 12 }}>
              Souhaitez-vous être recontacté(e) par Aravis Performance ? <span style={{ color: "#dc2626" }}>*</span>
            </p>
            <p style={{ fontSize: 12, color: "#94a3b8", marginBottom: 14 }}>Une réponse est obligatoire pour télécharger votre rapport.</p>

            {/* Non */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, cursor: "pointer", fontSize: 14, color: "#475569" }}>
              <input type="checkbox" checked={contactPref.none} onChange={() => handleContactChange("none")}
                style={{ width: 18, height: 18, accentColor: C1, cursor: "pointer" }} />
              🚫 Non, je ne souhaite pas être recontacté(e)
            </label>

            {/* Téléphone */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: contactPref.phone ? 8 : 10, cursor: "pointer", fontSize: 14, color: "#475569" }}>
              <input type="checkbox" checked={contactPref.phone} onChange={() => handleContactChange("phone")}
                style={{ width: 18, height: 18, accentColor: C1, cursor: "pointer" }} />
              📞 Par téléphone
            </label>
            {contactPref.phone && (
              <div style={{ marginLeft: 28, marginBottom: 10 }}>
                <input
                  type="tel"
                  placeholder="Votre numéro de téléphone"
                  value={phoneNumber}
                  onChange={e => setPhoneNumber(e.target.value)}
                  style={{ width: "100%", border: "2px solid #e2e8f0", borderRadius: 8, padding: "9px 12px", fontSize: 14, outline: "none", boxSizing: "border-box" }}
                />
              </div>
            )}

            {/* Email */}
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "#475569" }}>
              <input type="checkbox" checked={contactPref.email} onChange={() => handleContactChange("email")}
                style={{ width: 18, height: 18, accentColor: C1, cursor: "pointer" }} />
              ✉️ Par email ({form.email})
            </label>
          </div>

          {!contactSelected && (
            <div style={{ background: "#fef2f2", borderRadius: 8, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#dc2626" }}>
              ⚠️ Veuillez sélectionner une option de recontact pour télécharger votre rapport.
            </div>
          )}

          <button onClick={exportResult}
            disabled={loading || !aiComment || !contactSelected || (contactPref.phone && !phoneNumber)}
            style={{
              background: (loading || !aiComment || !contactSelected || (contactPref.phone && !phoneNumber)) ? "#94a3b8" : "#0f172a",
              color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px",
              fontSize: 15, fontWeight: 600,
              cursor: (loading || !aiComment || !contactSelected || (contactPref.phone && !phoneNumber)) ? "not-allowed" : "pointer",
              width: "100%",
            }}>
            ⬇️ Télécharger mon rapport PDF
          </button>
          {contactPref.phone && !phoneNumber && (
            <p style={{ fontSize: 12, color: "#94a3b8", textAlign: "center", marginTop: 8 }}>
              Merci de saisir votre numéro de téléphone.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
