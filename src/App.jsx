import { useState } from "react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip } from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ══ MAKE WEBHOOKS ══════════════════════════════════════════════════════════
const WEBHOOK_SHEETS    = "https://hook.eu1.make.com/mvkyqewrwl5dqkpas3q7n6dkaujrlyjr";
const WEBHOOK_AI        = "https://hook.eu1.make.com/hxjtmnjcmd8ul50wsd8p3hii4jgzsvyv";
const WEBHOOK_SEND_CODE = "https://hook.eu1.make.com/wx9ax6kfm69gfgc13k85ttk46yc5hbqf";
const WEBHOOK_CHECK_CODE = "https://hook.eu1.make.com/8rfm5s2uyj7x9frfh33bbvmflejqps8m";
const WORKER_AI_URL = "https://sc-maturity-ai.jbfleck.workers.dev";

const BLOCKED_DOMAINS = ["gmail.com","googlemail.com","hotmail.com","gmx.com","hotmail.fr","outlook.com","outlook.fr","live.com","live.fr","msn.com","yahoo.com","yahoo.fr","icloud.com","me.com","mac.com","laposte.net","orange.fr","sfr.fr","free.fr","wanadoo.fr","bbox.fr","numericable.fr","aol.com","protonmail.com","proton.me","tutanota.com","gmx.fr","mail.com","yandex.com","zoho.com","fastmail.com"];
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isProEmail = (e) => { const d = e.split("@")[1]?.toLowerCase(); return d && !BLOCKED_DOMAINS.includes(d); };

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

const MATURITY_LEVELS = [
  { level: 0, label: "Dysfonctionnel", color: "#dc2626", desc: "Aucun processus, décisions ad hoc" },
  { level: 1, label: "Réactif",        color: "#ea580c", desc: "Gestion en silos, pilotage par les crises" },
  { level: 2, label: "Défini",         color: "#d97706", desc: "Processus standardisés, KPIs basiques" },
  { level: 3, label: "Intégré",        color: "#65a30d", desc: "Collaboration étendue, analyse prédictive" },
  { level: 4, label: "Optimisé",       color: "#16a34a", desc: "Data-driven, IA, résilience proactive" },
  { level: 5, label: "Autonome",       color: "#0d9488", desc: "Auto-apprentissage, IoT, agilité extrême" },
];

const getLevel = (s) => MATURITY_LEVELS.find(l => l.level === Math.min(Math.round(s), 5)) || MATURITY_LEVELS[0];

const Logo = () => (
  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
    <div style={{ width:40, height:40, background:"#1e40af", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <span style={{ color:"#fff", fontWeight:800, fontSize:14 }}>AP</span>
    </div>
    <div>
      <div style={{ fontWeight:700, fontSize:13, color:"#0f172a", lineHeight:1.2 }}>Aravis Performance</div>
      <div style={{ fontSize:11, color:"#64748b" }}>Cabinet Conseil Supply Chain & Excellence Opérationnelle</div>
    </div>
  </div>
);

const Header = () => (
  <div style={{ background:"#fff", borderBottom:"1px solid #e2e8f0", padding:"14px 28px", marginBottom:28 }}>
    <Logo />
  </div>
);

const ProgressBar = ({ pct }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:6 }}>
      <span>Progression</span><span>{pct}%</span>
    </div>
    <div style={{ background:"#e2e8f0", height:5, borderRadius:99 }}>
      <div style={{ background:"#1e40af", height:"100%", width:`${pct}%`, borderRadius:99, transition:"width 0.4s ease" }} />
    </div>
  </div>
);

const card = { background:"#fff", borderRadius:16, padding:40, boxShadow:"0 4px 24px #0001", maxWidth:680, width:"100%", margin:"0 auto" };
const btn = (active) => ({ background: active ? "#1e40af" : "#94a3b8", color:"#fff", border:"none", borderRadius:8, padding:"14px 32px", fontSize:15, fontWeight:600, cursor: active ? "pointer" : "not-allowed", width:"100%" });

export default function App() {
  const [step, setStep] = useState("intro");
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);
  const [form, setForm] = useState({ prenom:"", nom:"", email:"", entreprise:"" });
  const [emailErr, setEmailErr] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [codeErr, setCodeErr] = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [aiComment, setAiComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [sheetStatus, setSheetStatus] = useState("idle");
  const [contactPref, setContactPref] = useState({ phone: false, email: false });

  const qScore = (i) => answers[i] ?? 0;

  const themeScore = (theme) => {
    const idxs = QUESTIONS.map((q,i) => q.theme === theme ? i : -1).filter(i => i >= 0);
    const avg = idxs.reduce((a,i) => a + qScore(i), 0) / idxs.length;
    return Math.round(avg * 10) / 10;
  };

  const avgScore = Math.round(THEMES.reduce((a,t) => a + themeScore(t), 0) / THEMES.length * 10) / 10;
  const level = getLevel(avgScore);

  const radarData = THEMES.map(t => ({ theme: t.length > 14 ? t.substring(0,13)+"…" : t, fullTheme: t, score: themeScore(t), fullMark: 5 }));

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
        method: "POST",
        mode: "no-cors",
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
        method: "POST",
        mode: "no-cors",
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
    const ctx = THEMES.map(t => `${t}: ${themeScore(t)}/5`).join(", ");
    const prompt = `Tu es Jean-Baptiste Fleck, consultant expert en supply chain et lean manufacturing, fondateur d'Aravis Performance, cabinet conseil certifié Qualiopi, fort de 25 années d'expérience et de plus de 20 audits-diagnostics réalisés ces 5 dernières années.

Un dirigeant de PME industrielle vient de réaliser une auto-évaluation de la maturité de sa supply chain sur 9 thématiques. Résultats :
${ctx}
Score global : ${avgScore}/5 — Niveau : ${level.label} (${level.desc})

Rédige un commentaire professionnel et bienveillant de 8-10 lignes en prose qui :
1. Situe précisément le niveau actuel avec empathie
2. Souligne 2 points forts et 2 axes prioritaires d'amélioration identifiés dans les résultats
3. Rappelle que cette auto-évaluation est indicative (les référentiels du marché comptent entre 150 et 200 questions) et qu'un audit-diagnostic en situation réelle est indispensable pour une analyse rigoureuse, contextualisée à la stratégie, au marché et à la taille de l'entreprise
4. Invite chaleureusement à contacter Aravis Performance pour un audit supply chain complet ou ciblé sur une fonction prioritaire, afin de co-construire une feuille de route de transformation réaliste et structurée
Prose uniquement, pas de bullet points, ton direct et expert.`;

    try {
      const res = await fetch(WORKER_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!res.ok) throw new Error(`Worker error: ${res.status}`);
      const data = await res.json();
      const comment = data.comment || "Commentaire indisponible.";
      setAiComment(comment);
      sendToSheets(comment);
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
      prenom: form.prenom, nom: form.nom, entreprise: form.entreprise, email: form.email,
      score_global: avgScore, niveau: level.label,
      ...Object.fromEntries(QUESTIONS.flatMap((q,i) => {
        const key = `Q${i+1}`;
        return [
          [`${key}_theme`, q.theme],
          [`${key}_reponse`, q.options[qScore(i)]],
          [`${key}_score`, qScore(i)],
        ];
      })),
      ...Object.fromEntries(THEMES.map(t => [`score_${t.replace(/[^a-zA-Z]/g,"_").toLowerCase()}`, themeScore(t)])),
      recontact_tel: contactPref.phone ? "Oui" : "Non",
      recontact_email: contactPref.email ? "Oui" : "Non",
      commentaire_ia: comment,
    };
    try {
      await fetch(WEBHOOK_SHEETS, { method:"POST", mode:"no-cors", headers:{ "Content-Type":"text/plain" }, body: JSON.stringify(payload) });
      setSheetStatus("ok");
    } catch { setSheetStatus("error"); }
  };

  const exportResult = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const blue = [30, 64, 175];
    const dark = [15, 23, 42];
    const gray = [71, 85, 105];
    const lightBlue = [239, 246, 255];
    const pageW = 210;
    const margin = 20;

    doc.setFillColor(...blue);
    doc.rect(0, 0, pageW, 28, "F");
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Aravis Performance", margin, 11);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(191, 219, 254);
    doc.text("Cabinet Conseil Supply Chain & Excellence Operationnelle", margin, 17);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Rapport de maturite Supply Chain", margin, 24);

    let y = 38;
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(`${form.prenom} ${form.nom}`, margin + 4, y + 7);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...gray);
    doc.text(`${form.entreprise}  -  ${form.email}`, margin + 4, y + 13);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin + 4, y + 19);

    y += 30;
    doc.setFillColor(...blue);
    doc.roundedRect(margin, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, "F");
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`${avgScore}/5`, margin + 6, y + 14);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(191, 219, 254);
    doc.text("Score global", margin + 6, y + 20);
    const levelX = margin + (pageW - margin * 2) / 2 + 4;
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(levelX, y, (pageW - margin * 2) / 2 - 4, 22, 3, 3, "F");
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text(level.label, levelX + 4, y + 12);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...gray);
    doc.text(level.desc, levelX + 4, y + 19);

    y += 30;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("Scores par thematique", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["Thematique", "Score", "Niveau"]],
      body: THEMES.map(t => {
        const s = themeScore(t);
        const l = getLevel(s);
        return [t, `${s} / 5`, l.label];
      }),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: blue, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 90 },
        1: { cellWidth: 25, halign: "center" },
        2: { cellWidth: 45, halign: "center" },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...dark);
    doc.text("Detail des reponses", margin, y);
    y += 4;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [["#", "Thematique", "Reponse selectionnee", "Niv."]],
      body: QUESTIONS.map((q, i) => [
        `Q${i + 1}`,
        q.theme,
        q.options[qScore(i)],
        qScore(i),
      ]),
      styles: { fontSize: 7.5, cellPadding: 2, overflow: "linebreak" },
      headStyles: { fillColor: blue, textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      columnStyles: {
        0: { cellWidth: 10, halign: "center" },
        1: { cellWidth: 38 },
        2: { cellWidth: 105 },
        3: { cellWidth: 10, halign: "center" },
      },
    });

    y = doc.lastAutoTable.finalY + 10;
    if (y > 240) { doc.addPage(); y = 20; }

    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin, y, pageW - margin * 2, 8, 2, 2, "F");
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...blue);
    doc.text("Analyse personnalisee", margin + 4, y + 5.5);
    y += 12;

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...dark);
    const lines = doc.splitTextToSize(aiComment, pageW - margin * 2);
    doc.text(lines, margin, y);
    y += lines.length * 5 + 10;

    if (y > 250) { doc.addPage(); y = 20; }
    doc.setFillColor(...blue);
    doc.roundedRect(margin, y, pageW - margin * 2, 28, 3, 3, "F");
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Jean-Baptiste FLECK - Fondateur Aravis Performance", margin + 4, y + 8);
    doc.setFontSize(8.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(191, 219, 254);
    doc.text("07 64 54 01 58", margin + 4, y + 15);
    doc.text("jbfleck@aravisperformance.com", margin + 4, y + 21);
    doc.text("www.aravisperformance.com", margin + 80, y + 15);
    doc.text("Certifie QUALIOPI - Supply Chain Master", margin + 80, y + 21);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setFontSize(7);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${i} / ${pageCount}  -  Aravis Performance  -  Rapport confidentiel`,
        pageW / 2, 292, { align: "center" }
      );
    }

    doc.save(`maturite-supply-chain-${form.entreprise.replace(/\s+/g, "-")}.pdf`);
  };

  // ══ INTRO ══════════════════════════════════════════════════
  if (step === "intro") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={card}>
          <div style={{ fontSize:12, fontWeight:600, color:"#1e40af", textTransform:"uppercase", letterSpacing:1, marginBottom:10 }}>Auto-évaluation Supply Chain</div>
          <h1 style={{ fontSize:26, fontWeight:700, color:"#0f172a", marginBottom:20, lineHeight:1.4 }}>Quel est le niveau de maturité de votre Supply Chain ?</h1>
          <div style={{ background:"#f1f5f9", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#475569", display:"flex", gap:10 }}>
            <span style={{ fontSize:18 }}>📋</span>
            <span>Ce questionnaire comporte <strong>18 questions structurantes</strong> réparties sur <strong>9 thématiques</strong> couvrant l'ensemble de votre supply chain. Comptez <strong>10 à 15 minutes</strong> pour y répondre avec attention.</span>
          </div>
          <div style={{ background:"#eff6ff", borderLeft:"4px solid #1e40af", borderRadius:"0 10px 10px 0", padding:"18px 20px", marginBottom:20 }}>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:0 }}>
              Cette auto-évaluation vous donne un <strong>premier aperçu indicatif de votre niveau de maturité supply chain</strong>. Elle est volontairement simplifiée et <strong>ne présage pas de la maturité exacte de votre entreprise</strong>. À titre de comparaison, les référentiels du marché comptent entre <strong>150 et 200 questions</strong>.
            </p>
          </div>
          <p style={{ color:"#475569", fontSize:14, lineHeight:1.9, marginBottom:16 }}>
            ⚠️ Un véritable diagnostic nécessite de remettre les résultats en perspective avec <strong>plusieurs paramètres : la stratégie de votre entreprise, votre marché, la taille de votre organisation</strong>, et bien d'autres facteurs contextuels. C'est l'objet d'un <strong>audit supply chain complet</strong> ou d'un <strong>audit ciblé sur une fonction spécifique</strong>.
          </p>
          <p style={{ color:"#475569", fontSize:14, lineHeight:1.9, marginBottom:16 }}>
            Le diagnostic met en lumière les <strong>points forts</strong> de votre organisation et les <strong>gisements de progrès</strong>. La feuille de route qui en découle permet d'agréger les axes de transformation de manière cohérente, pour atteindre le niveau de maturité suivant — sans brûler les étapes.
          </p>
          <div style={{ background:"#fff7ed", borderLeft:"4px solid #ea580c", borderRadius:"0 10px 10px 0", padding:"12px 18px", marginBottom:28 }}>
            <p style={{ color:"#9a3412", fontSize:13, lineHeight:1.8, margin:0 }}>
              ⚠️ <strong>Important :</strong> le diagnostic et la feuille de route ne font pas partie de cette auto-évaluation. Ils nécessitent l'intervention d'un expert en situation réelle.
            </p>
          </div>
          <button style={btn(true)} onClick={() => setStep("quiz")}>Démarrer l'auto-évaluation →</button>
        </div>
      </div>
    </div>
  );

  // ══ QUIZ ═══════════════════════════════════════════════════
  if (step === "quiz") {
    const q = QUESTIONS[current];
    const pct = Math.round(((current + 1) / QUESTIONS.length) * 100);
    const themeIdx = THEMES.indexOf(q.theme);
    const themeColors = ["#1e40af","#2563eb","#7c3aed","#0891b2","#059669","#d97706","#ea580c","#dc2626","#6b21a8"];
    const tc = themeColors[themeIdx] || "#1e40af";
    return (
      <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
        <Header />
        <div style={{ padding:"0 24px 48px" }}>
          <div style={card}>
            <ProgressBar pct={pct} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:12, fontWeight:600, color:tc, textTransform:"uppercase", letterSpacing:1, background:`${tc}15`, padding:"4px 10px", borderRadius:99 }}>{q.theme}</div>
              <span style={{ fontSize:12, color:"#94a3b8" }}>Question {current+1} / {QUESTIONS.length}</span>
            </div>
            <h2 style={{ fontSize:19, fontWeight:600, color:"#0f172a", marginBottom:28, lineHeight:1.5, marginTop:16 }}>{q.q}</h2>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {q.options.map((opt,i) => (
                <button key={i} onClick={() => handleAnswer(i)}
                  style={{ background: answers[current] === i ? `${tc}10` : "#f8fafc", border:`2px solid ${answers[current] === i ? tc : "#e2e8f0"}`, borderRadius:10, padding:"12px 16px", textAlign:"left", fontSize:13, color:"#334155", cursor:"pointer", lineHeight:1.6, display:"flex", gap:10, alignItems:"flex-start" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor=tc; e.currentTarget.style.background=`${tc}10`; }}
                  onMouseLeave={e => { if(answers[current]!==i){ e.currentTarget.style.borderColor="#e2e8f0"; e.currentTarget.style.background="#f8fafc"; }}}>
                  <span style={{ minWidth:22, height:22, borderRadius:99, background: answers[current]===i ? tc : "#e2e8f0", color: answers[current]===i ? "#fff" : "#64748b", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, marginTop:1 }}>{i}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              {current > 0 && <button onClick={() => setCurrent(current-1)} style={{ background:"#f1f5f9", color:"#475569", border:"none", borderRadius:8, padding:"12px 20px", fontSize:14, fontWeight:600, cursor:"pointer", flex:1 }}>← Précédent</button>}
              {answers[current] !== undefined && (
                <button onClick={() => current < QUESTIONS.length-1 ? setCurrent(current+1) : setStep("form")}
                  style={{ background:tc, color:"#fff", border:"none", borderRadius:8, padding:"12px 20px", fontSize:14, fontWeight:600, cursor:"pointer", flex:2 }}>
                  {current < QUESTIONS.length-1 ? "Suivant →" : "Voir mes résultats →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ══ FORM ═══════════════════════════════════════════════════
  if (step === "form") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:500 }}>
          <ProgressBar pct={100} />
          <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Vos coordonnées</h2>
          <p style={{ color:"#64748b", marginBottom:24, fontSize:14, lineHeight:1.7 }}>Un code de vérification vous sera envoyé par email pour accéder à votre rapport personnalisé.</p>
          {[
            { key:"prenom", label:"Prénom *", type:"text" },
            { key:"nom", label:"Nom *", type:"text" },
            { key:"entreprise", label:"Entreprise *", type:"text" },
            { key:"email", label:"Email professionnel *", type:"email" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={{ fontSize:13, fontWeight:600, color:"#374151", display:"block", marginBottom:5 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e => setForm({...form,[f.key]:e.target.value})}
                style={{ width:"100%", border:`2px solid ${f.key==="email" && emailErr ? "#dc2626" : "#e2e8f0"}`, borderRadius:8, padding:"10px 14px", fontSize:14, outline:"none", boxSizing:"border-box" }} />
            </div>
          ))}
          {emailErr && <div style={{ color:"#dc2626", fontSize:13, marginBottom:12, padding:"8px 12px", background:"#fef2f2", borderRadius:6 }}>⚠️ {emailErr}</div>}
          <p style={{ fontSize:12, color:"#94a3b8", marginBottom:18 }}>* Champs obligatoires. Données utilisées uniquement dans le cadre de cette auto-évaluation.</p>
          <button style={btn(!!(form.prenom && form.nom && form.email && form.entreprise) && !codeSending)}
            onClick={handleFormSubmit} disabled={!(form.prenom && form.nom && form.email && form.entreprise) || codeSending}>
            {codeSending ? "⏳ Envoi en cours…" : "Recevoir mon code de vérification →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ══ EMAIL VERIFY ═══════════════════════════════════════════
  if (step === "email_verify") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:480, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📧</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Vérifiez votre email</h2>
          <p style={{ color:"#475569", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
            Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.<br />Saisissez-le ci-dessous pour accéder à votre rapport.
          </p>
          <input type="text" maxLength={6} value={codeInput}
            onChange={e => { setCodeInput(e.target.value.replace(/\D/g,"")); setCodeErr(""); }}
            placeholder="_ _ _ _ _ _"
            style={{ width:"100%", border:`2px solid ${codeErr ? "#dc2626" : "#e2e8f0"}`, borderRadius:10, padding:"14px", fontSize:24, textAlign:"center", letterSpacing:10, outline:"none", boxSizing:"border-box", marginBottom:12, fontWeight:700 }} />
          {codeErr && <div style={{ color:"#dc2626", fontSize:13, marginBottom:12, padding:"8px 12px", background:"#fef2f2", borderRadius:6 }}>⚠️ {codeErr}</div>}
          <button style={btn(codeInput.length===6)} onClick={handleVerifyCode} disabled={codeInput.length!==6}>
            Valider et accéder à mon rapport →
          </button>
          <p style={{ fontSize:12, color:"#94a3b8", marginTop:14 }}>
            Pas reçu le code ? <span style={{ color:"#1e40af", cursor:"pointer" }} onClick={() => setStep("form")}>Modifier mon email</span>
          </p>
        </div>
      </div>
    </div>
  );

  // ══ RESULT ═════════════════════════════════════════════════
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ maxWidth:760, margin:"0 auto", padding:"0 16px 56px" }}>

        {sheetStatus==="sending" && <div style={{ background:"#eff6ff", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#1e40af" }}>📤 Enregistrement de vos résultats en cours…</div>}
        {sheetStatus==="ok"      && <div style={{ background:"#f0fdf4", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#16a34a" }}>✅ Vos résultats ont bien été enregistrés.</div>}
        {sheetStatus==="error"   && <div style={{ background:"#fff7ed", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, color:"#ea580c" }}>⚠️ Erreur d'enregistrement — vérifiez la configuration Make.</div>}

        {/* Score global */}
        <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px #0001", marginBottom:20, textAlign:"center" }}>
          <div style={{ fontSize:13, color:"#64748b", marginBottom:6 }}>Résultats pour <strong>{form.prenom} {form.nom}</strong> — {form.entreprise}</div>
          <h1 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:16 }}>Maturité Supply Chain</h1>
          <div style={{ display:"inline-block", background:level.color, color:"#fff", borderRadius:99, padding:"10px 28px", fontSize:20, fontWeight:700, marginBottom:12 }}>
            Niveau {avgScore}/5 — {level.label}
          </div>
          <p style={{ color:"#64748b", fontSize:14, margin:0, lineHeight:1.7 }}>{level.desc}</p>
        </div>

        {/* Niveaux */}
        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:18 }}>Les 6 niveaux de maturité Supply Chain</h2>
          {MATURITY_LEVELS.map(l => (
            <div key={l.level} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 14px", borderRadius:8, background: Math.round(avgScore)===l.level ? `${l.color}18` : "#f8fafc", border:`2px solid ${Math.round(avgScore)===l.level ? l.color : "transparent"}`, marginBottom:8 }}>
              <div style={{ minWidth:28, height:28, borderRadius:99, background:l.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13 }}>{l.level}</div>
              <div>
                <span style={{ fontWeight:700, fontSize:13, color:"#0f172a" }}>{l.label}</span>
                {Math.round(avgScore)===l.level && <span style={{ fontSize:12, color:l.color, fontWeight:600, marginLeft:8 }}>← Votre niveau</span>}
                <div style={{ fontSize:12, color:"#64748b" }}>{l.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Radar */}
        <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:20, textAlign:"center" }}>Radar par thématique</h2>
          <ResponsiveContainer width="100%" height={420}>
            <RadarChart data={radarData} margin={{ top:30, right:60, bottom:30, left:60 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={(props) => {
                const { x, y, cx, cy, payload } = props;
                const words = payload.value.split(" ");
                const lines = [];
                let current = "";
                words.forEach(w => {
                  if ((current + " " + w).trim().length > 12) {
                    if (current) lines.push(current);
                    current = w;
                  } else {
                    current = (current + " " + w).trim();
                  }
                });
                if (current) lines.push(current);
                const anchor = Math.abs(x - cx) < 10 ? "middle" : x > cx ? "start" : "end";
                return (
                  <text x={x} y={y} textAnchor={anchor} fill="#475569" fontSize={10}>
                    {lines.map((line, i) => (
                      <tspan key={i} x={x} dy={i === 0 ? `-${(lines.length - 1) * 7}` : "14"}>{line}</tspan>
                    ))}
                  </text>
                );
              }} />
              <PolarRadiusAxis angle={30} domain={[0,5]} tick={{ fontSize:9 }} tickCount={6} />
              <Radar name="Score" dataKey="score" stroke="#1e40af" fill="#1e40af" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Histogramme */}
        <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:20, textAlign:"center" }}>Scores par thématique</h2>
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={[...THEMES.map(t => ({ theme: t, score: themeScore(t) }))].sort((a,b) => a.score - b.score)}
              layout="vertical"
              margin={{ top:0, right:40, bottom:0, left:140 }}
            >
              <XAxis type="number" domain={[0,5]} tickCount={6} tick={{ fontSize:10 }} />
              <YAxis type="category" dataKey="theme" tick={{ fontSize:11, fill:"#475569" }} width={135} />
              <Tooltip formatter={(v) => [`${v}/5`, "Score"]} />
              <Bar dataKey="score" radius={[0,6,6,0]}>
                {[...THEMES.map(t => ({ theme: t, score: themeScore(t) }))].sort((a,b) => a.score - b.score).map((entry, i) => (
                  <Cell key={i} fill={getLevel(entry.score).color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:10, justifyContent:"center", flexWrap:"wrap", marginTop:16 }}>
            {MATURITY_LEVELS.map(l => (
              <div key={l.level} style={{ display:"flex", alignItems:"center", gap:5, fontSize:11, color:"#475569" }}>
                <div style={{ width:12, height:12, borderRadius:3, background:l.color }} />
                {l.level} — {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Analyse IA */}
        <div style={{ background:"#fff", borderRadius:16, padding:32, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:16 }}>Analyse personnalisée</h2>
          {loading
            ? <div style={{ color:"#64748b", fontStyle:"italic", textAlign:"center", padding:32 }}>⏳ Génération de votre analyse en cours…</div>
            : <p style={{ color:"#334155", lineHeight:1.9, fontSize:14, margin:0 }}>{aiComment}</p>}
        </div>

        {/* Audit info */}
        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:14 }}>Qu'est-ce qu'un audit supply chain ?</h2>
          <p style={{ color:"#475569", fontSize:14, lineHeight:1.9, marginBottom:14 }}>
            Pour un audit en situation réelle, il faut compter <strong>entre 1 et 10 jours selon la taille de l'entreprise</strong>, y compris pour une PME. L'expert réalise l'audit-diagnostic et construit la feuille de route, restituée au <strong>CODIR de l'entreprise</strong> afin de s'emparer des enjeux supply chain au sein de l'organisation.
          </p>
          <div style={{ background:"#fefce8", borderLeft:"4px solid #ca8a04", borderRadius:"0 10px 10px 0", padding:"14px 18px" }}>
            <p style={{ color:"#713f12", fontSize:13, lineHeight:1.8, margin:0 }}>
              <strong>⚖️ Indépendance et impartialité de l'auditeur</strong><br />
              Un auditeur est indépendant et réalise sa mission en toute impartialité. <strong>L'auditeur ne propose pas ses services pour la mise en œuvre de la feuille de route</strong> afin d'éviter tout conflit d'intérêt. Il peut en revanche <strong>orienter l'entreprise vers des experts spécialisés en fonction des sujets identifiés lors de l'audit</strong>.
            </p>
          </div>
        </div>

        {/* Profil */}
        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 4px 24px #0001", marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:18 }}>Votre interlocuteur</h2>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:20, padding:"14px 18px", background:"#eff6ff", borderRadius:10 }}>
            <div style={{ width:52, height:52, background:"#1e40af", borderRadius:99, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
              <span style={{ color:"#fff", fontWeight:800, fontSize:15 }}>JBF</span>
            </div>
            <div>
              <div style={{ fontWeight:700, fontSize:16, color:"#0f172a" }}>Jean-Baptiste FLECK</div>
              <div style={{ fontSize:12, color:"#64748b" }}>Fondateur — Aravis Performance · Certifié QUALIOPI</div>
            </div>
          </div>
          {[
            { icon:"⭐", text:"25 années d'expérience en Supply Chain & Excellence Opérationnelle" },
            { icon:"🔍", text:"Plus de 20 audits-diagnostics menés au cours des 5 dernières années" },
            { icon:"🏅", text:"Auditeur certifié France Supply Chain & Supply Chain Master" },
            { icon:"📋", text:"Maîtrise des référentiels MMOG/LE et Supply Chain Plus" },
            { icon:"🥋", text:"Black Belt Lean 6 Sigma" },
            { icon:"🎓", text:"CPIM — Certified in Planning and Inventory Management" },
          ].map((item,i) => (
            <div key={i} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"11px 14px", background: i%2===0 ? "#f8fafc" : "#fff", borderRadius:8, fontSize:14, color:"#1e293b", lineHeight:1.5, marginBottom:6, border:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:18, flexShrink:0 }}>{item.icon}</span>
              <span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background:"#1e40af", borderRadius:16, padding:28, marginBottom:20 }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#fff", marginBottom:8 }}>Envie d'aller plus loin ?</h2>
          <p style={{ color:"#bfdbfe", fontSize:14, lineHeight:1.7, marginBottom:20 }}>
            Contactez Jean-Baptiste FLECK pour un audit supply chain complet ou ciblé sur une fonction prioritaire. Ensemble, construisons une feuille de route de transformation adaptée à votre entreprise.
          </p>
          <div style={{ background:"rgba(255,255,255,0.15)", borderRadius:10, padding:"16px 20px", display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { icon:"📞", val:"07 64 54 01 58" },
              { icon:"✉️", val:"jbfleck@aravisperformance.com" },
              { icon:"🌐", val:"www.aravisperformance.com" },
            ].map((c,i) => (
              <div key={i} style={{ fontSize:14, color:"#e0f2fe", display:"flex", gap:10, alignItems:"center" }}>
                <span style={{ fontSize:16 }}>{c.icon}</span><span>{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recontact + Export */}
        <div style={{ background:"#fff", borderRadius:16, padding:28, boxShadow:"0 4px 24px #0001" }}>
          <h2 style={{ fontSize:15, fontWeight:600, color:"#0f172a", marginBottom:16 }}>Télécharger mon rapport</h2>
          <div style={{ background:"#f8fafc", borderRadius:10, padding:"16px 20px", marginBottom:20 }}>
            <p style={{ fontSize:13, fontWeight:600, color:"#374151", marginBottom:12 }}>Souhaitez-vous être recontacté(e) par Aravis Performance ?</p>
            <label style={{ display:"flex", alignItems:"center", gap:10, marginBottom:10, cursor:"pointer", fontSize:14, color:"#475569" }}>
              <input type="checkbox" checked={contactPref.phone} onChange={e => setContactPref({...contactPref, phone:e.target.checked})}
                style={{ width:18, height:18, accentColor:"#1e40af", cursor:"pointer" }} />
              📞 Par téléphone
            </label>
            <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, color:"#475569" }}>
              <input type="checkbox" checked={contactPref.email} onChange={e => setContactPref({...contactPref, email:e.target.checked})}
                style={{ width:18, height:18, accentColor:"#1e40af", cursor:"pointer" }} />
              ✉️ Par email ({form.email})
            </label>
          </div>
          <button onClick={exportResult} disabled={loading || !aiComment}
            style={{ background: loading || !aiComment ? "#94a3b8" : "#0f172a", color:"#fff", border:"none", borderRadius:8, padding:"14px 32px", fontSize:15, fontWeight:600, cursor: loading || !aiComment ? "not-allowed" : "pointer", width:"100%" }}>
            ⬇️ Télécharger mon rapport PDF
          </button>
        </div>

      </div>
    </div>
  );
}
