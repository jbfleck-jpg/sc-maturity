import { useState } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ReferenceLine
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const WEBHOOK_SHEETS     = "https://hook.eu1.make.com/mvkyqewrwl5dqkpas3q7n6dkaujrlyjr";
const WEBHOOK_SEND_CODE  = "https://hook.eu1.make.com/wx9ax6kfm69gfgc13k85ttk46yc5hbqf";
const WEBHOOK_CHECK_CODE = "https://hook.eu1.make.com/8rfm5s2uyj7x9frfh33bbvmflejqps8m";
const WEBHOOK_NOTIFY     = "https://hook.eu1.make.com/oy47delx1iom8lw8qrn14yqds2u8xn89";
const WORKER_AI_URL      = "https://sc-maturity-ai.jbfleck.workers.dev";
const CALENDLY_URL       = "https://calendly.com/jbfleck/30min";

const C1 = "#0C2F72";
const C2 = "#4472C4";

const BLOCKED_DOMAINS = ["gmail.com","googlemail.com","hotmail.com","gmx.com","hotmail.fr","outlook.com","outlook.fr","live.com","live.fr","msn.com","yahoo.com","yahoo.fr","icloud.com","me.com","mac.com","laposte.net","orange.fr","sfr.fr","free.fr","wanadoo.fr","bbox.fr","numericable.fr","aol.com","protonmail.com","proton.me","tutanota.com","gmx.fr","mail.com","yandex.com","zoho.com","fastmail.com"];
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isProEmail = (e) => { const d = e.split("@")[1]?.toLowerCase(); return d && !BLOCKED_DOMAINS.includes(d); };

const stripMarkdown = (text) => text
  .replace(/^#{1,4}\s+/gm, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/\*(.*?)\*/g, "$1")
  .replace(/^[-*]\s+/gm, "")
  .trim();

const hexToRgb = (hex) => [
  parseInt(hex.slice(1,3),16),
  parseInt(hex.slice(3,5),16),
  parseInt(hex.slice(5,7),16)
];

// Parse AI text into 5 named sections by detecting ALL-CAPS title lines
const parseAiSections = (text) => {
  if (!text) return null;
  const TITLES = [
    { key: "maturityLevel",   patterns: ["VOTRE NIVEAU DE MATURITE", "VOTRE NIVEAU DE MATURITÉ"] },
    { key: "strengths",       patterns: ["POINTS FORTS"] },
    { key: "improvements",    patterns: ["POINTS D'AMELIORATION", "POINTS D'AMÉLIORATION", "POINTS DE PROGRESSION"] },
    { key: "recommendations", patterns: ["RECOMMANDATIONS"] },
    { key: "nextSteps",       patterns: ["PROCHAINES ETAPES", "PROCHAINES ÉTAPES"] },
  ];
  // Split text into lines
  const lines = text.split("\n");
  // Find where each section starts (line index of its title)
  const sectionStarts = [];
  lines.forEach((line, idx) => {
    const trimmed = line.trim().toUpperCase();
    TITLES.forEach(({ key, patterns }) => {
      if (patterns.some(p => trimmed === p || trimmed.startsWith(p))) {
        sectionStarts.push({ key, idx });
      }
    });
  });
  if (sectionStarts.length === 0) {
    // Fallback: split by double newlines
    const paras = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    return {
      maturityLevel: paras[0] || "",
      strengths: paras[1] || "",
      improvements: paras[2] || "",
      recommendations: paras[3] || "",
      nextSteps: paras[4] || "",
    };
  }
  // Extract content between section titles (skip the title line itself)
  const result = { maturityLevel:"", strengths:"", improvements:"", recommendations:"", nextSteps:"" };
  sectionStarts.forEach(({ key, idx }, i) => {
    const endIdx = i + 1 < sectionStarts.length ? sectionStarts[i+1].idx : lines.length;
    const sectionLines = lines.slice(idx + 1, endIdx).join("\n").trim();
    result[key] = sectionLines;
  });
  return result;
};

// Strip the ALL-CAPS section title from start of paragraph text
const cleanSectionText = (text, ...patterns) => {
  let t = text;
  patterns.forEach(p => { t = t.replace(new RegExp(`^${p}\\s*`, "i"), ""); });
  return t.trim();
};

const QUESTIONS = [
  { theme: "Stratégie Supply Chain", q: "Comment votre direction générale perçoit-elle la Supply Chain ?", options: ["La SC se limite au transport et à l'entrepôt, considérés comme de simples postes de coût","La logistique est gérée en silos, sans lien avec la stratégie commerciale ou de production","La SC est reconnue comme une fonction stratégique avec des objectifs de performance définis","Plusieurs stratégies SC sont formalisées selon les segments produits/marchés avec des SLA clients et fournisseurs","Une feuille de route SC digitale est déployée (EDI, IoT, SaaS, BI, automatisation) par canal de distribution","L'entreprise est intégrée dans un écosystème collaboratif avec une visibilité end-to-end"] },
  { theme: "Stratégie Supply Chain", q: "Quels moyens sont mis à disposition de la Supply Chain pour réaliser sa stratégie ?", options: ["Aucun moyen humain et financier spécifique n'est affecté à la Supply Chain","Des ressources humaines sont mobilisées de manière ad hoc selon les urgences (alternants, CDD)","Des collaborateurs sont identifiés sur chaque fonction de la supply chain avec un budget par fonction","Une ou plusieurs stratégies SC sont définies selon la stratégie des opérations (MTS, MTO, ATO, ETO), les segments produits/marchés et les enjeux de l'entreprise. Un budget SC est formalisé et revu annuellement","Un budget SC est défini avec des ROI mesurés par projet, permettant d'arbitrer les investissements. Le budget fait l'objet d'une revue périodique dans l'année","Les investissements SC font l'objet d'un pilotage stratégique pluriannuel avec des ROI démontrés, contribuant à la performance globale et à une meilleure valorisation lors d'une éventuelle cession"] },
  { theme: "Processus & Organisation", q: "Comment vos processus Supply Chain sont-ils documentés et maîtrisés ?", options: ["Les processus ne sont pas documentés, le savoir-faire repose uniquement sur les individus","Certains processus sont documentés mais de manière incomplète et non maintenue à jour","Les processus opérationnels sont documentés et à jour, mais les processus support et transverses ne sont pas couverts","Une démarche BPMN est déployée (ou ISO 9001 engagée), incluant les processus support et transverses. Des responsables de processus et des KPIs sont définis sur les processus clés","L'amélioration continue est intégrée : analyses de causes racines, mises à jour régulières et pilotage de la performance par processus","Des projets de digitalisation et d'automatisation des processus sont engagés (RPA, workflows, IA, outils no-code) pour gagner en fiabilité et en efficience"] },
  { theme: "Processus & Organisation", q: "Comment est organisée la fonction Supply Chain dans votre entreprise ?", options: ["Aucun responsable logistique ou SCM n'est identifié, les activités SC sont éclatées entre les fonctions","Un responsable logistique ou SCM existe mais ne couvre pas l'ensemble des processus SC","La fonction SC couvre les processus clés (appro, planification, service client, transport, logistique interne et externe) mais n'est pas représentée au CODIR","Un(e) directeur(trice) SC siège au CODIR et couvre l'ensemble des processus : appro, planification, service client, transport, logistique interne et externe","La fonction SC maîtrise ses master data, dispose d'un service méthodes logistiques avec des compétences en gestion de projet et pilote activement sa transformation","L'entreprise benchmarke avec des pairs, adhère à des associations professionnelles pour identifier des gisements de gains, et collabore activement avec ses homologues chez les clients et fournisseurs"] },
  { theme: "Approvisionnement & Achats", q: "Comment gérez-vous votre panel fournisseurs ?", options: ["Aucune gestion du panel, les fournisseurs sont choisis au cas par cas sans critères définis","Des fournisseurs habituels existent mais sans évaluation ni contractualisation formelle","Les fournisseurs sont référencés avec des critères de sélection et des contrats de base","Le panel est structuré avec une segmentation fournisseurs, des évaluations régulières, un protocole fournisseur formalisé avec les plus importants, et des plans de progrès en partenariat avec le service achats","Des partenariats stratégiques sont développés avec les fournisseurs clés. Des revues de performance fournisseurs sont co-animées en partenariat avec le service achats, avec des indicateurs partagés","L'entreprise co-innove avec ses fournisseurs stratégiques et intègre des critères RSE dans la gestion du panel"] },
  { theme: "Approvisionnement & Achats", q: "Comment pilotez-vous vos approvisionnements au quotidien ?", options: ["Les commandes sont passées en réaction aux ruptures, sans anticipation ni calcul de besoin","Les approvisionnements reposent sur l'expérience des approvisionneurs sans méthode formalisée","Les approvisionneurs réalisent des prévisions et s'appuient sur des paramètres de base (stocks mini, points de commande) mais ceux-ci sont rarement révisés","Les besoins sont calculés via un CBN ou MRP. Les approvisionneurs utilisent plusieurs méthodes de passation de commande selon la fréquence et la quantité. Les paramètres sont suivis et mis à jour régulièrement","Les approvisionnements sont optimisés via des outils avancés ; le portefeuille fournisseurs et les paramètres de gestion font l'objet d'une revue formelle à fréquence régulière, a minima tous les 3 mois","Les flux d'approvisionnement sont synchronisés en temps réel avec les fournisseurs via une plateforme dédiée (GPA, EDI, VMI) offrant une visibilité end-to-end"] },
  { theme: "Service Client", q: "Comment est géré le flux de commande client (Order to Cash) ?", options: ["Les commandes sont saisies manuellement sans processus défini ni accusé de réception systématique","Les commandes sont saisies et confirmées par email mais sans vérification de disponibilité des stocks ni intégration avec la production","Le module de gestion des commandes est intégré au SI, permettant un contrôle de disponibilité et une date d'engagement ferme (ATP/CTP)","Le flux Order to Cash est maîtrisé par une équipe pluridisciplinaire (ADV, transport, entrepôt, planification) avec des KPIs de suivi","Les commandes sont reçues et intégrées automatiquement via EDI ou API avec les clients, avec envoi sécurisé des AR et factures","La Supply Chain pilote en temps réel la demande réelle des clients clés via des programmes collaboratifs (GPA/VMI) avec partage de données en continu, voire une démarche CPFR"] },
  { theme: "Service Client", q: "Quel est le périmètre et le positionnement de votre ADV / Service Client ?", options: ["Aucune fonction ADV ou Service Client clairement identifiée, les commandes sont gérées par les commerciaux","Une fonction ADV existe mais se limite à la saisie des commandes et à la facturation, sans lien avec la Supply Chain","L'ADV gère le flux de commande (saisie, AR, facturation, litiges) mais le Service Client reste rattaché au commercial sans coordination SC","L'ADV est intégrée à la Supply Chain (flux de commande) et le Service Client au commercial (relation client), avec un KPI commun de satisfaction client","Le Service Client pilote les réclamations, les enquêtes de satisfaction, le reporting KPI et alimente une démarche d'amélioration continue en lien avec la SC","Le Service Client gère des programmes collaboratifs (GPA/VMI) avec les clients clés et co-construit les offres de service sur la base de données partagées en temps réel"] },
  { theme: "Gestion des stocks", q: "Comment définissez-vous et pilotez-vous votre politique de stocks ?", options: ["Les niveaux de stock sont déterminés au jugé ou en termes de couverture, sans technique d'optimisation ni cible définie. De nombreuses ruptures subites perturbent régulièrement l'activité","Les niveaux de stock (mini/maxi, stocks de sécurité) sont dimensionnés sur la base de règles simples et empiriques","Les paramètres de stock sont calculés (point de commande, stock de sécurité, MOQ) et une classification ABC est réalisée deux fois par an","Les niveaux de stock sont optimisés par segment (ABC2) en fonction de la variabilité de la demande, des délais fournisseurs et des objectifs de service client, avec une revue trimestrielle. Une politique de stock est en place et suivie","Toutes les méthodes de gestion de stock sont maîtrisées selon les segments (fréquence/quantité variable ou fixe). Le niveau de stock est sous contrôle en quantité et valeur en euros, en accord avec les objectifs du contrôle de gestion","Des flux tirés sont mis en place sur certains segments de familles AA. Les encours sont réduits grâce à des méthodes comme le DBR ou le DDMRP. Les règles de gestion sont définies en collaboration avec les partenaires clés"] },
  { theme: "Gestion des stocks", q: "Comment assurez-vous la fiabilité et la maîtrise de vos stocks ?", options: ["Il n'existe aucune procédure d'entrée et de sortie des produits dans les magasins. Les écarts sont nombreux et comptabilisés principalement lors de l'inventaire annuel. Les stocks sont suivis sur un tableur","Une méthode de gestion des sorties est appliquée (FIFO, LIFO ou autre). Les écarts sont corrigés lors des prélèvements mais ne font pas l'objet d'une analyse de causes. Une part non négligeable de stock est obsolète. La précision des stocks n'est pas suivie","L'accès au magasin est contrôlé, le personnel est formé. Des inventaires tournants sont effectués mais chaque référence n'est inventoriée qu'une à deux fois par an. La précision est supérieure à 95%, sans système de traçabilité (code-barres)","Le stock informatique correspond au stock physique. Un système de traçabilité est en place (code-barres). Les inventaires tournants sont fréquents (précision > 98%) et des indicateurs clés sont suivis mensuellement (rotation, obsolescence, taux de remplissage, coût total)","Des lecteurs codes-barres, datamatrix ou capteurs IoT fiabilisent les mouvements de stock. Les inventaires tournants sont systématiques sur les classes A et B (précision > 99,8%). Des alertes automatiques déclenchent des actions correctives en cas de dérive","La visibilité complète des stocks en tous points du réseau permet de détecter immédiatement tout écart. Les inventaires tournants sont suffisamment fiables pour supprimer l'inventaire annuel, évitant toute interruption des réceptions et expéditions"] },
  { theme: "Flux internes", q: "Comment sont organisés et pilotés vos flux internes ?", options: ["Les flux internes sont gérés par la production sans organisation logistique dédiée","Un responsable logistique interne existe mais les flux sont subis, non anticipés et peu formalisés","Les flux internes sont cartographiés et des règles de gestion sont définies (tournées, fréquences d'approvisionnement des lignes)","Les flux internes sont pilotés par des systèmes de type kanban ou flux tirés, avec des indicateurs de suivi des approvisionnements de ligne","Des gammes de manutention ou un outil dédié permettent d'optimiser les flux internes (séquencement, tournées, gestion des ressources)","Les ressources de flux internes sont mutualisées entre les secteurs. Une démarche VSM est déployée pour identifier et éliminer les gaspillages et optimiser les flux de bout en bout"] },
  { theme: "Flux internes", q: "Comment mesurez-vous et optimisez-vous la performance de vos flux internes ?", options: ["Aucun indicateur de performance, les flux ne sont pas visibles dans l'atelier et les dysfonctionnements sont traités au cas par cas","Quelques mesures informelles existent (retards, ruptures de ligne) sans suivi structuré ni management visuel","Des KPIs de base sont suivis et des outils de management visuel sont présents dans l'atelier (tableaux de bord, affichages) rendant les flux visibles pour les équipes","Les KPIs sont formalisés et revus régulièrement en réunion d'équipe. Le management visuel est structuré (andon, flux matérialisés au sol) et les écarts font l'objet d'analyses de causes et de plans d'action","Les déplacements sont suivis et tracés. Le management visuel est digital et intégré dans un tableau de bord SC global avec des alertes en cas de dérive","Des algorithmes d'optimisation, un jumeau numérique et des équipements IoT embarqués permettent de piloter et simuler les flux en temps réel, couplés à une démarche d'amélioration continue (VSM, kaizen)"] },
  { theme: "Logistique", q: "Comment est organisé et piloté votre entrepôt ? (stocks amont et aval, interne et externe)", options: ["Aucun système d'adressage, les produits sont entreposés sans organisation. La gestion des stocks repose sur des fichiers Excel. L'entrepôt est encombré et les allées obstruées","L'entrepôt est rangé et propre, les flux entrée/sortie sont séparés. L'ERP est utilisé pour la gestion des stocks avec des fonctionnalités limitées (adressage fixe, mouvements de base)","Le zonage est cartographié, des solutions de stockage dynamique sont en place. L'ERP couvre les fonctions essentielles (inventaire, préparation de commande, expédition et transport) de manière simplifiée et sans lien avec l'extérieur. Une démarche d'amélioration continue est engagée","Un WMS intégré au SI gère le multi-emplacements, l'ordonnancement des préparations, l'optimisation des chemins, le pré-colisage et les étiquettes logistiques. La prise de rendez-vous est digitalisée","Des installations automatisées sont déployées (transstockeurs, shuttles, AGV, robots) lorsque nécessaire. Des liens EDI sont établis avec les partenaires clés. Les équipements font l'objet d'une maintenance préventive et prédictive","Les prévisions issues du processus S&OP sont transformées en besoins logistiques anticipés pour optimiser les ressources et l'espace. L'entrepôt est piloté via des interfaces multiples avec tous les acteurs de la chaîne"] },
  { theme: "Logistique", q: "Comment mesurez-vous et améliorez-vous la performance de votre entrepôt ?", options: ["Aucune mesure d'efficacité des opérations (réception, stockage, préparation, expédition)","La performance est mesurée uniquement en termes de productivité et d'erreurs de préparation. La polyvalence informelle du personnel est mise à profit","Plusieurs ratios sont suivis : lignes préparées/jour/personne, taux de commandes expédiées complètes à la date promise sans erreur, utilisation des quais","Un tableau de bord complet est suivi régulièrement : taux de service, temps de préparation, fiabilité, productivité, taux de remplissage, coûts. Les écarts font l'objet de plans d'amélioration continue","Le contrôle de conformité des flux entrants et sortants est automatisé (caméras, portiques RFID) ou via l'intégration des ordres d'achat lors de la réception. Les indicateurs sont calculés en temps réel avec des alertes correctives","La connaissance en temps réel des statuts de préparation et de livraison sur l'ensemble du réseau permet d'anticiper tout événement et d'optimiser les opérations avec l'ensemble des partenaires SC"] },
  { theme: "Transport", q: "Comment organisez-vous et pilotez-vous votre transport ?", options: ["Aucune organisation transport définie, les expéditions sont gérées au cas par cas sans prestataire attitré ni cahier des charges","Des transporteurs habituels sont utilisés mais sans contrat formalisé, ni optimisation des tournées ou des chargements","Des contrats transport sont en place, les prestataires sont sélectionnés sur des critères définis (coût, délai, qualité). Les expéditions sont planifiées mais sans outil dédié","Un TMS ou un outil de gestion transport est déployé, permettant la planification des réceptions, des tournées, des expéditions et le suivi avec des statuts de transport","Les échanges avec les transporteurs sont automatisés (EDI, API). Les données transport sont intégrées au SI pour une visibilité complète des flux et une facturation contrôlée automatiquement","Les prévisions issues du processus S&OP sont transformées en besoins transport anticipés. L'entreprise participe à des programmes de mutualisation du transport dans une démarche RSE active"] },
  { theme: "Transport", q: "Comment mesurez-vous et optimisez-vous la performance de votre transport ?", options: ["Aucun indicateur transport suivi, les litiges et retards sont gérés au cas par cas","Quelques indicateurs informels existent (retards, litiges) sans suivi structuré ni revue avec les transporteurs","Les KPIs de base sont suivis (taux de livraison à l'heure, taux de litiges, coût/km ou coût/colis) et partagés avec les transporteurs lors de revues périodiques","Un tableau de bord transport est formalisé et revu a minima tous les mois. Chaque retard est tracé et une cause racine est systématiquement assignée. Les plans d'amélioration sont suivis avec les prestataires","La performance transport est pilotée en temps réel avec des alertes automatiques. Les émissions de CO2 sont disponibles et intégrées dans les critères de décision. Des revues de performance sont réalisées avec les principaux transporteurs","Les indicateurs transport sont partagés avec tous les transporteurs. L'optimisation est continue grâce à des algorithmes de planification intégrant contraintes capacitaires, délais, coûts et empreinte carbone"] },
  { theme: "Système d'Information", q: "Quel est le niveau de maturité et d'intégration de votre SI Supply Chain ?", options: ["Aucun outil de gestion, les données sont gérées sur papier ou via des fichiers Excel non partagés","Un ERP basique est en place mais utilisé partiellement. Les commandes achat et les commandes clients sont ressaisies manuellement dans l'ERP","L'ERP couvre les principales fonctions SC (commandes, stocks, achats, production) avec des données centralisées et quelques initiatives d'intégration des commandes clients","Le SI est intégré et couvre l'ensemble des processus SC. Des outils spécialisés (WMS, TMS, APS) communiquent avec l'ERP, évitant les ressaisies. Les commandes clients sont majoritairement intégrées automatiquement. Les commandes fournisseurs sont envoyées de manière digitalisée","Le SI est connecté avec les partenaires clés via EDI ou API. Les master data sont maîtrisées et gouvernées. Un référentiel de données unique est en place","Le SI est ouvert et interopérable avec l'ensemble de l'écosystème (clients, fournisseurs, transporteurs, prestataires) via des interfaces standardisées en temps réel"] },
  { theme: "Système d'Information", q: "Comment utilisez-vous les données pour piloter et améliorer votre Supply Chain ?", options: ["Aucun tableau de bord ni indicateur, les décisions se prennent sans données fiables","Quelques indicateurs sont produits manuellement via Excel, sans automatisation ni fiabilité garantie","Des tableaux de bord sont en place avec des KPIs SC de base, alimentés automatiquement par l'ERP","Un outil de BI est déployé, les données sont consolidées et analysées pour piloter la performance SC et alimenter les prises de décision","Les écarts avec les niveaux de performance sont tracés et des causes racines sont identifiées pour l'amélioration continue. Des algorithmes prédictifs et du machine learning sont utilisés pour anticiper la demande et optimiser les stocks","L'IA et le Big Data permettent un pilotage en temps réel de la SC via une Control Tower offrant une visibilité end-to-end, des capacités d'auto-apprentissage et de recommandation automatique"] },
];

const THEMES = [...new Set(QUESTIONS.map(q => q.theme))];

const MATURITY_LEVELS = [
  { level:0, label:"Implicite",  color:"#dc2626", desc:"Aucun processus formalisé. Gestion individuelle, réactive, en silos.", detail:"La Supply Chain repose sur l'expérience individuelle et les habitudes locales. Les décisions sont prises au cas par cas, en réaction aux urgences. Les dysfonctionnements sont acceptés comme une fatalité.", keywords:"Non formalisé · Réactif · Silos · Absence de stratégie" },
  { level:1, label:"Formalisée", color:"#ea580c", desc:"Processus documentés par fonction, mais cloisonnés.", detail:"Les processus commencent à être formalisés par fonction (achats, production, logistique) par nécessité. La documentation existe mais reste cloisonnée. Les KPIs locaux sont suivis sans analyse globale.", keywords:"Processus documentés · Silos persistants · KPIs locaux · Réactivité" },
  { level:2, label:"Maîtrisée",  color:"#d97706", desc:"Processus alignés sur la stratégie globale, début de collaboration.", detail:"Tous les processus sont formalisés et alignés sur une stratégie globale. L'entreprise cherche à stabiliser ses opérations. Un responsable SC est nommé. Les silos commencent à s'atténuer.", keywords:"Processus alignés · KPIs transverses · Stabilisation · Outils centralisés" },
  { level:3, label:"Intégrée",   color:"#65a30d", desc:"Vision globale, S&OP déployé, collaboration systématique.", detail:"Toutes les fonctions SC travaillent ensemble. Un S&OP synchronise demande et offre. La collaboration est systématique en interne et avec les partenaires. Les outils ERP/WMS/TMS sont intégrés.", keywords:"Collaboration systématique · S&OP · Vision globale · Intégration des outils" },
  { level:4, label:"Améliorée",  color:"#16a34a", desc:"Amélioration continue, décisions data-driven, centre d'excellence.", detail:"L'entreprise intègre l'amélioration continue dans sa culture SC. Les processus sont optimisés via Lean, Six Sigma, DDMRP. Les décisions sont data-driven. Un centre d'excellence SC capitalise les bonnes pratiques.", keywords:"Amélioration continue · Data-driven · Lean/Six Sigma · Centre d'excellence" },
  { level:5, label:"Optimisée",  color:"#0d9488", desc:"Centre de profit différenciant, IA/IoT, visibilité end-to-end.", detail:"La SC est perçue comme un centre de profit différenciant. Les technologies avancées (IA, IoT, blockchain) sont intégrées. Les processus sont auto-optimisés. Les services logistiques sont monétisés.", keywords:"Centre de profit · IA/IoT/Blockchain · Visibilité end-to-end · Monétisation" },
];

const getLevel = (s) => MATURITY_LEVELS.find(l => l.level === Math.min(Math.round(s), 5)) || MATURITY_LEVELS[0];

// ── Shared styles ────────────────────────────────────────────────────────────
const card = { background:"#fff", borderRadius:16, padding:40, boxShadow:"0 4px 24px #0001", maxWidth:680, width:"100%", margin:"0 auto" };
const btn = (active) => ({ background:active?C1:"#94a3b8", color:"#fff", border:"none", borderRadius:8, padding:"14px 32px", fontSize:15, fontWeight:600, cursor:active?"pointer":"not-allowed", width:"100%" });

const Header = () => (
  <div style={{ background:"#fff", borderBottom:`3px solid ${C1}`, padding:"14px 28px", marginBottom:28 }}>
    <div style={{ fontWeight:900, fontSize:22, color:C1, letterSpacing:"-0.5px" }}>Aravis Performance</div>
  </div>
);

const ProgressBar = ({ pct }) => (
  <div style={{ marginBottom:28 }}>
    <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#94a3b8", marginBottom:6 }}>
      <span>Progression</span><span>{pct}%</span>
    </div>
    <div style={{ background:"#e2e8f0", height:5, borderRadius:99 }}>
      <div style={{ background:C1, height:"100%", width:`${pct}%`, borderRadius:99, transition:"width 0.4s ease" }} />
    </div>
  </div>
);

// Colored bar left + bold title for AI sections
const SectionBlock = ({ title, color, bg, children }) => (
  <div style={{ marginBottom:18, padding:"16px 18px", background:bg, borderRadius:10, borderLeft:`4px solid ${color}` }}>
    <div style={{ fontWeight:700, fontSize:14, color, marginBottom:8 }}>{title}</div>
    <p style={{ color:"#1e293b", lineHeight:1.9, fontSize:13.5, margin:0, whiteSpace:"pre-line" }}>{children}</p>
  </div>
);

// ── PDF helpers ──────────────────────────────────────────────────────────────
const drawRadarPDF = (doc, cx, cy, radius, themeScores, avgScore) => {
  const n = themeScores.length;
  const step = (2 * Math.PI) / n;
  const lvlColor = hexToRgb(getLevel(avgScore).color);

  // Filled average-level polygon (blended with white to simulate 40% opacity)
  const avgPts = themeScores.map((_, i) => {
    const a = i * step - Math.PI / 2;
    const r = radius * avgScore / 5;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const bR = Math.round(lvlColor[0] * 0.4 + 255 * 0.6);
  const bG = Math.round(lvlColor[1] * 0.4 + 255 * 0.6);
  const bB = Math.round(lvlColor[2] * 0.4 + 255 * 0.6);
  doc.setFillColor(bR, bG, bB);
  doc.setDrawColor(bR, bG, bB);
  if (avgPts.length > 1) {
    const lines = [];
    for (let i = 1; i < avgPts.length; i++) lines.push([avgPts[i][0]-avgPts[i-1][0], avgPts[i][1]-avgPts[i-1][1]]);
    doc.lines(lines, avgPts[0][0], avgPts[0][1], [1,1], "FD");
  }

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const pts = themeScores.map((_, i) => {
      const a = i * step - Math.PI / 2;
      return [cx+(radius*ring/5)*Math.cos(a), cy+(radius*ring/5)*Math.sin(a)];
    });
    doc.setDrawColor(210,210,210); doc.setLineWidth(0.3);
    for (let i=0; i<n; i++) doc.line(pts[i][0], pts[i][1], pts[(i+1)%n][0], pts[(i+1)%n][1]);
    doc.setFontSize(6); doc.setTextColor(160,160,160);
    doc.text(`${ring}`, cx+1, cy - radius*ring/5 + 2);
  }
  // Axes
  themeScores.forEach((_, i) => {
    const a = i * step - Math.PI / 2;
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    doc.line(cx, cy, cx+radius*Math.cos(a), cy+radius*Math.sin(a));
  });
  // Score polygon
  const pts = themeScores.map((d, i) => {
    const a = i * step - Math.PI / 2;
    return [cx+(radius*d.score/5)*Math.cos(a), cy+(radius*d.score/5)*Math.sin(a)];
  });
  doc.setDrawColor(12,47,114); doc.setLineWidth(1.5);
  for (let i=0; i<pts.length; i++) doc.line(pts[i][0], pts[i][1], pts[(i+1)%pts.length][0], pts[(i+1)%pts.length][1]);
  pts.forEach(([x,y]) => { doc.setFillColor(12,47,114); doc.circle(x, y, 1.2, "F"); });

  // Average label in center
  doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setTextColor(lvlColor[0], lvlColor[1], lvlColor[2]);
  doc.text(`Moy. ${avgScore}/5`, cx, cy+3, { align:"center" });
  doc.setFont("helvetica","normal");

  // Full-name labels around radar
  doc.setFontSize(7.5); doc.setTextColor(30,30,30); doc.setFont("helvetica","bold");
  themeScores.forEach((d, i) => {
    const a = i * step - Math.PI / 2;
    const lx = cx + (radius+22)*Math.cos(a);
    const ly = cy + (radius+22)*Math.sin(a);
    const align = Math.abs(lx-cx)<8 ? "center" : lx>cx ? "left" : "right";
    const words = d.theme.split(" ");
    const lines = []; let curr = "";
    words.forEach(w => {
      if ((curr+" "+w).trim().length > 15) { if (curr) lines.push(curr); curr = w; }
      else curr = (curr+" "+w).trim();
    });
    if (curr) lines.push(curr);
    const lh = 4;
    const sy = ly - ((lines.length-1)*lh)/2;
    lines.forEach((line,li) => doc.text(line, lx, sy+li*lh, { align }));
  });
  doc.setFont("helvetica","normal");
};

const drawBarChartPDF = (doc, startX, startY, chartW, barData, avgScore) => {
  const barH = 8; const gap = 4;
  const labelW = 62; const scoreW = 14;
  const barAreaW = chartW - labelW - scoreW - 6;
  const totalH = barData.length * (barH + gap);

  // Average dashed line — positioned with enough room for label on left
  // Calculate x position
  const avgX = startX + labelW + (barAreaW * avgScore / 5);
  doc.setDrawColor(220,38,38); doc.setLineWidth(0.8);
  doc.setLineDashPattern([2,2], 0);
  doc.line(avgX, startY-14, avgX, startY+totalH);
  doc.setLineDashPattern([], 0);
  // Label above, anchored to center of line, shifted left so it never clips right margin
  doc.setFontSize(7); doc.setTextColor(220,38,38); doc.setFont("helvetica","bold");
  doc.text(`Moy. ${avgScore}`, avgX, startY-16, { align:"center" });
  doc.setFont("helvetica","normal");

  barData.forEach((item, i) => {
    const y = startY + i*(barH+gap);
    const bw = Math.max(2, (barAreaW * item.score) / 5);
    const rgb = hexToRgb(getLevel(item.score).color);
    doc.setFontSize(7); doc.setTextColor(70,70,70);
    const words = item.theme.split(" ");
    const lines = []; let curr = "";
    words.forEach(w => {
      if ((curr+" "+w).trim().length > 18) { if (curr) lines.push(curr); curr = w; }
      else curr = (curr+" "+w).trim();
    });
    if (curr) lines.push(curr);
    if (lines.length === 1) doc.text(lines[0], startX, y+barH-1);
    else { doc.text(lines[0], startX, y+3); doc.text(lines[1]||"", startX, y+barH); }
    doc.setFillColor(...rgb);
    doc.roundedRect(startX+labelW, y, bw, barH, 1.5, 1.5, "F");
    doc.setFontSize(7); doc.setTextColor(30,30,30);
    doc.text(`${item.score}`, startX+labelW+bw+3, y+barH-1);
  });

  const legendY = startY + totalH + 10;
  let lx = startX;
  MATURITY_LEVELS.forEach(l => {
    const rgb = hexToRgb(l.color);
    doc.setFillColor(...rgb); doc.rect(lx, legendY, 4, 4, "F");
    doc.setFontSize(6); doc.setTextColor(60,60,60);
    doc.text(`${l.level}-${l.label}`, lx+5, legendY+3.5);
    lx += 32;
    if (lx > startX+chartW-10) lx = startX;
  });
};

// ── Main component ───────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]               = useState("intro");
  const [answers, setAnswers]         = useState({});
  const [current, setCurrent]         = useState(0);
  const [form, setForm]               = useState({ prenom:"", nom:"", email:"", entreprise:"" });
  const [emailErr, setEmailErr]       = useState("");
  const [codeInput, setCodeInput]     = useState("");
  const [codeErr, setCodeErr]         = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [aiComment, setAiComment]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [sheetStatus, setSheetStatus] = useState("idle");
  const [contactPref, setContactPref] = useState({ none:false, phone:false, email:false });
  const [phoneNumber, setPhoneNumber] = useState("");

  const contactSelected = contactPref.none || contactPref.phone || contactPref.email;
  const canDownload = contactSelected && !loading && !!aiComment && !(contactPref.phone && !phoneNumber);

  const handleContactChange = (key) => {
    if (key === "none") setContactPref({ none:true, phone:false, email:false });
    else setContactPref(prev => ({ ...prev, none:false, [key]:!prev[key] }));
  };

  const qScore = (i) => answers[i] ?? 0;
  const themeScore = (theme) => {
    const idxs = QUESTIONS.map((q,i) => q.theme===theme?i:-1).filter(i=>i>=0);
    return Math.round(idxs.reduce((a,i)=>a+qScore(i),0)/idxs.length*10)/10;
  };
  const avgScore = Math.round(THEMES.reduce((a,t)=>a+themeScore(t),0)/THEMES.length*10)/10;
  const level = getLevel(avgScore);
  const radarData = THEMES.map(t => ({ theme:t, score:themeScore(t), fullMark:5 }));
  const barData = [...THEMES.map(t => ({ theme:t, score:themeScore(t) }))].sort((a,b)=>a.score-b.score);
  const aiSections = parseAiSections(aiComment);

  const handleAnswer = (score) => {
    const na = { ...answers, [current]:score };
    setAnswers(na);
    current < QUESTIONS.length-1 ? setCurrent(current+1) : setStep("form");
  };

  const handleFormSubmit = async () => {
    setEmailErr("");
    if (!validEmail(form.email)) { setEmailErr("Veuillez saisir un email valide."); return; }
    if (!isProEmail(form.email)) { setEmailErr("Merci de saisir votre email professionnel (Gmail, Hotmail, Yahoo et autres messageries personnelles non acceptées)."); return; }
    setCodeSending(true);
    try {
      await fetch(WEBHOOK_SEND_CODE, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify({ email:form.email, prenom:form.prenom }) });
      setStep("email_verify");
      generateComment();
    } catch { setEmailErr("Erreur lors de l'envoi du code. Veuillez réessayer."); }
    setCodeSending(false);
  };

  const handleVerifyCode = async () => {
    setCodeErr("");
    try {
      await fetch(WEBHOOK_CHECK_CODE, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify({ email:form.email, code:codeInput.trim() }) });
      setStep("result");
    } catch { setCodeErr("Erreur de vérification. Veuillez réessayer."); }
  };

  const generateComment = async () => {
    setLoading(true);

    // Sort themes by score for targeted sections
    const sortedByScore = THEMES.map(t => ({ t, s: themeScore(t) })).sort((a,b) => b.s - a.s);
    const top3 = sortedByScore.slice(0, 3).map(x => `${x.t} : ${x.s}/5`).join(", ");
    const bottom3 = [...sortedByScore].slice(-3).reverse().map(x => `${x.t} : ${x.s}/5`).join(", ");
    const ctx = THEMES.map(t=>`${t} : ${themeScore(t)}/5`).join(", ");

    // Proximity to next maturity level
    const nextLevel = Math.min(Math.ceil(avgScore + 0.01), 5);
    const distToNext = Math.round((nextLevel - avgScore) * 100) / 100;
    let proximityInstruction = "";
    if (distToNext <= 0.1) {
      proximityInstruction = `Score ${avgScore}/5 : a ${distToNext} du niveau ${nextLevel}. Preciser qu'en ciblant 5 chapitres cles, le niveau ${nextLevel} est atteignable rapidement.`;
    } else if (distToNext <= 0.25) {
      proximityInstruction = `Score ${avgScore}/5 : a ${distToNext} du niveau ${nextLevel}. Recommander de consolider le niveau actuel sur 3 chapitres prioritaires avant de viser le niveau ${nextLevel}.`;
    } else {
      proximityInstruction = `Score ${avgScore}/5 : a ${distToNext} du niveau ${nextLevel}. Pour progresser vers le niveau ${nextLevel}, travailler en profondeur sur 5 chapitres prioritaires.`;
    }

    const prompt = `Tu es Jean-Baptiste Fleck, consultant expert en supply chain, fondateur d'Aravis Performance, certifie Qualiopi, 25 ans d'experience, plus de 20 audits-diagnostics realises.

Un dirigeant de PME industrielle vient de realiser une auto-evaluation de la maturite de sa supply chain.
Tous les resultats par thematique : ${ctx}
Score global : ${avgScore}/5 - Niveau actuel : ${level.label} (niveau ${Math.round(avgScore)}) - ${level.desc}

Redige une analyse en EXACTEMENT 5 paragraphes separes chacun par UNE LIGNE VIDE.
REGLES ABSOLUES :
- TEXTE BRUT UNIQUEMENT. Aucun markdown, aucun #, aucun **, aucun tiret de liste.
- Chaque phrase fait MAXIMUM 18 mots.
- Reviens a la ligne apres CHAQUE phrase (une phrase = une ligne).
- MAXIMUM 700 mots au total.
- Ton direct, expert, bienveillant.
- Ne jamais ecrire "mon audit" ni "me contacter". Ecrire "un audit", "l'audit Aravis Performance", "contacter Aravis Performance".
- Commence chaque paragraphe par son titre en MAJUSCULES sur sa propre ligne.

PARAGRAPHE 1 - titre : VOTRE NIVEAU DE MATURITE
${proximityInstruction}
Explique en 3 phrases ce que ce niveau signifie concretement pour l'entreprise.
(4 a 5 phrases au total)

PARAGRAPHE 2 - titre : POINTS FORTS
Les 3 meilleures thematiques sont exactement : ${top3}
Valorise uniquement ces 3 thematiques, pas d'autres.
Pour chacune, explique concretement ce que le score revele comme pratiques solides en place.
(6 a 7 phrases)

PARAGRAPHE 3 - titre : POINTS D'AMELIORATION
Les 3 thematiques avec les scores les plus faibles sont exactement : ${bottom3}
Traite uniquement ces 3 thematiques, pas d'autres.
Pour chacune, propose une action concrete et prioritaire a engager.
(6 a 7 phrases)

PARAGRAPHE 4 - titre : RECOMMANDATIONS
Commence par rappeler que cette auto-evaluation est declarative et indicative.
Explique qu'un audit terrain revele souvent des ecarts significatifs avec la perception interne.
Invite a realiser un audit-diagnostic Aravis Performance pour objectiver la situation reelle.
Ensuite, presente les 6 gains potentiels EXACTEMENT sur des lignes separees, sans ponctuation finale :
Performance de livraison : +15 a +30 %
Reduction des stocks : 25 a 40 %
Fiabilite des previsions : +25 a +70 %
Productivite : +10 a +20 %
Capacite de production : +10 a +20 %
Reduction des couts logistiques : 25 a 40 %
(9 a 10 lignes en tout pour ce paragraphe)

PARAGRAPHE 5 - titre : PROCHAINES ETAPES
Explique les avantages concrets d'un audit-diagnostic terrain par rapport a cette auto-evaluation.
Insiste sur la necessite d'aller plus loin pour identifier davantage de points forts et d'axes d'amelioration.
Rappelle qu'un audit complet contient entre 150 et 200 questions par domaine.
Invite chaleureusement a contacter Aravis Performance pour un audit complet ou cible sur une fonction prioritaire.
(5 a 6 phrases)`;

    try {
      const res = await fetch(WORKER_AI_URL, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ prompt, max_tokens:3500 })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiComment(stripMarkdown(data.comment || "Commentaire indisponible."));
    } catch { setAiComment("Erreur lors de la génération du commentaire."); }
    setLoading(false);
  };

  const sendNotification = async () => {
    try {
      await fetch(WEBHOOK_NOTIFY, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify({
        date:new Date().toLocaleString("fr-FR"), prenom:form.prenom, nom:form.nom,
        entreprise:form.entreprise, email:form.email, score_global:avgScore, niveau:level.label,
        recontact_tel:contactPref.phone?"Oui":"Non",
        telephone:phoneNumber||"",
        recontact_email:contactPref.email?"Oui":"Non",
      })});
    } catch {}
  };

  const sendToSheets = async () => {
    if (!WEBHOOK_SHEETS) { setSheetStatus("error"); return; }
    setSheetStatus("sending");
    const payload = {
      date:new Date().toLocaleString("fr-FR"), prenom:form.prenom, nom:form.nom,
      entreprise:form.entreprise, email:form.email, score_global:avgScore, niveau:level.label,
      recontact_non:contactPref.none?"Oui":"Non",
      recontact_tel:contactPref.phone?"Oui":"Non",
      // FIX: always include telephone field
      telephone:phoneNumber||"",
      recontact_email:contactPref.email?"Oui":"Non",
      ...Object.fromEntries(QUESTIONS.flatMap((q,i) => {
        const k=`Q${i+1}`;
        return [[`${k}_theme`,q.theme],[`${k}_reponse`,q.options[qScore(i)]],[`${k}_score`,qScore(i)]];
      })),
      ...Object.fromEntries(THEMES.map(t=>[`score_${t.replace(/[^a-zA-Z]/g,"_").toLowerCase()}`,themeScore(t)])),
      commentaire_ia:aiComment,
    };
    try {
      await fetch(WEBHOOK_SHEETS, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body:JSON.stringify(payload) });
      setSheetStatus("ok");
    } catch { setSheetStatus("error"); }
  };

  const exportResult = async () => {
    await sendToSheets();
    if (contactPref.phone || contactPref.email) await sendNotification();

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const blue=[12,47,114]; const dark=[15,23,42]; const gray=[71,85,105]; const lightBlue=[239,246,255];
    const pageW=210; const margin=20; const contentW=pageW-margin*2;

    // ── PAGE 1 ──────────────────────────────────────────────────────────────
    // Compact header — 28mm only
    doc.setFillColor(...blue); doc.rect(0,0,pageW,28,"F");
    // "Aravis Performance" — white, bold
    doc.setFontSize(14); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("Aravis Performance", margin, 9);
    // Report title — white, slightly smaller
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    const rTitle = `Rapport de maturite simplifie de la supply chain de : ${form.entreprise}`;
    const rTitleLines = doc.splitTextToSize(rTitle, contentW);
    doc.text(rTitleLines, margin, 17);
    // Contact line — light blue, at bottom of header
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text("07 64 54 01 58  |  jbfleck@aravisperformance.com  |  www.aravisperformance.com", margin, 25);

    let y = 34;

    // ── Identite + Score sur la meme ligne ─────────────────────────────────
    const lvlRgb = hexToRgb(level.color);
    const idW = contentW * 0.52;
    const scoreW_block = contentW * 0.22;
    const levelW_block = contentW * 0.22;
    const gap = (contentW - idW - scoreW_block - levelW_block) / 2;
    const rowH = 22;

    // Identite block (left)
    doc.setFillColor(...lightBlue); doc.roundedRect(margin, y, idW, rowH, 2,2,"F");
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text(`${form.prenom} ${form.nom}`, margin+4, y+6);
    doc.setFont("helvetica","normal"); doc.setFontSize(8); doc.setTextColor(...gray);
    const entEmail = doc.splitTextToSize(`${form.entreprise} - ${form.email}`, idW-8);
    entEmail.forEach((l,i) => doc.text(l, margin+4, y+12+i*4));
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin+4, y+rowH-3);

    // Score block (middle)
    const sx = margin + idW + gap;
    doc.setFillColor(...blue); doc.roundedRect(sx, y, scoreW_block, rowH, 2,2,"F");
    doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(`${avgScore}/5`, sx + scoreW_block/2, y+12, { align:"center" });
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text("Score global", sx + scoreW_block/2, y+18, { align:"center" });

    // Level block (right) — color of level, label only (no desc to avoid overflow)
    const lx = sx + scoreW_block + gap;
    doc.setFillColor(...lvlRgb); doc.roundedRect(lx, y, levelW_block, rowH, 2,2,"F");
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(level.label, lx + levelW_block/2, y+13, { align:"center" });

    y += rowH + 5;

    // Disclaimer line
    doc.setFontSize(6.5); doc.setFont("helvetica","italic"); doc.setTextColor(...gray);
    doc.text("Niveau indicatif base sur un nombre reduit d'informations, sans analyse complete du perimetre supply chain.", margin, y); y+=7;

    // Niveaux de maturite
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Les 6 niveaux de maturite Supply Chain", margin, y); y+=5;

    MATURITY_LEVELS.forEach(l => {
      const rgb = hexToRgb(l.color);
      const isCur = Math.round(avgScore)===l.level;
      // Clip detail text to avoid overflow: max 2 lines
      const detailFull = doc.splitTextToSize(l.detail, contentW-16);
      const detailL = detailFull.slice(0,2); // max 2 lines
      const kwL = doc.splitTextToSize(l.keywords, contentW-16);
      const bH = Math.max(14, 6 + detailL.length*4 + kwL.length*3.5 + 2);
      if (y+bH>285) { doc.addPage(); y=20; }
      if (isCur) { doc.setFillColor(...rgb); }
      else { doc.setFillColor(248,250,252); }
      doc.roundedRect(margin, y, contentW, bH, 2,2,"F");
      doc.setFillColor(...rgb); doc.circle(margin+4.5, y+bH/2, 3,"F");
      doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.setTextColor(isCur?255:30, isCur?255:30, isCur?255:30);
      // Level label — clip to avoid overflow
      const labelText = `${l.level} - ${l.label}`;
      doc.text(labelText, margin+11, y+5);
      if (isCur) {
        doc.setFontSize(7); doc.setTextColor(255,255,255);
        doc.text("<-- VOTRE NIVEAU", margin+contentW-36, y+5);
      }
      doc.setFontSize(7); doc.setFont("helvetica","normal");
      doc.setTextColor(isCur?245:70, isCur?245:70, isCur?245:70);
      doc.text(detailL, margin+11, y+10);
      const kwY = y+10+detailL.length*4;
      doc.setFontSize(6); doc.setFont("helvetica","bold");
      doc.setTextColor(isCur?230:rgb[0], isCur?230:rgb[1], isCur?230:rgb[2]);
      doc.text(kwL, margin+11, kwY);
      y += bH+2;
    });
    y += 3;

    // ── PAGE 2 : Scores + Radar + Barchart ──────────────────────────────────
    doc.addPage(); y=20;
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Scores par thematique", margin, y); y+=4;
    autoTable(doc, {
      startY:y, margin:{left:margin,right:margin},
      head:[["Thematique","Score","Niveau"]],
      body:THEMES.map(t=>{ const s=themeScore(t); return [t,`${s} / 5`,getLevel(s).label]; }),
      styles:{fontSize:9,cellPadding:3},
      headStyles:{fillColor:blue,textColor:255,fontStyle:"bold"},
      alternateRowStyles:{fillColor:[248,250,252]},
      columnStyles:{0:{cellWidth:90},1:{cellWidth:25,halign:"center"},2:{cellWidth:45,halign:"center"}},
    });
    y = doc.lastAutoTable.finalY+10;

    if (y+145>280) { doc.addPage(); y=20; }
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Radar par thematique", margin, y); y+=5;
    const cx=pageW/2; const cy=y+62; const radarR=47;
    drawRadarPDF(doc, cx, cy, radarR, THEMES.map(t=>({theme:t,score:themeScore(t)})), avgScore);
    y = cy+radarR+30;

    if (y+barData.length*14+46>280) { doc.addPage(); y=20; }
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Scores par thematique (classement)", margin, y); y+=12;
    const barData_pdf = [...THEMES.map(t=>({theme:t,score:themeScore(t)}))].sort((a,b)=>a.score-b.score);
    drawBarChartPDF(doc, margin, y, contentW, barData_pdf, avgScore);
    y += barData_pdf.length*13+28;

    // ── PAGE 3 : Detail reponses ─────────────────────────────────────────────
    doc.addPage(); y=20;
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Detail des reponses", margin, y); y+=4;
    autoTable(doc, {
      startY:y, margin:{left:margin,right:margin},
      head:[["#","Thematique","Reponse selectionnee","Niv."]],
      body:QUESTIONS.map((q,i)=>[`Q${i+1}`,q.theme,q.options[qScore(i)],qScore(i)]),
      styles:{fontSize:7.5,cellPadding:2,overflow:"linebreak"},
      headStyles:{fillColor:blue,textColor:255,fontStyle:"bold"},
      alternateRowStyles:{fillColor:[248,250,252]},
      columnStyles:{0:{cellWidth:10,halign:"center"},1:{cellWidth:38},2:{cellWidth:105},3:{cellWidth:10,halign:"center"}},
    });

    // ── PAGE 4 : Analyse ────────────────────────────────────────────────────
    doc.addPage(); y=20;
    doc.setFillColor(...lightBlue); doc.roundedRect(margin,y,contentW,9,2,2,"F");
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Analyse personnalisee", margin+4, y+6); y+=14;

    const sectionDefs = [
      { title:"VOTRE NIVEAU DE MATURITE", color:[12,47,114],  text:aiSections?.maturityLevel||"" },
      { title:"POINTS FORTS",             color:[22,163,74],  text:aiSections?.strengths||"" },
      { title:"POINTS D'AMELIORATION",    color:[217,119,6],  text:aiSections?.improvements||"" },
      { title:"RECOMMANDATIONS",          color:[124,58,237], text:aiSections?.recommendations||"" },
      { title:"PROCHAINES ETAPES",        color:[13,148,136], text:aiSections?.nextSteps||"" },
    ];

    const sectionLabels = {
      "VOTRE NIVEAU DE MATURITE": "Votre niveau de maturite",
      "POINTS FORTS":             "Points forts",
      "POINTS D'AMELIORATION":    "Points d'amelioration",
      "RECOMMANDATIONS":          "Recommandations",
      "PROCHAINES ETAPES":        "Prochaines etapes",
    };
    sectionDefs.forEach(({ title, color, text }) => {
      if (!text) return;
      const clean = cleanSectionText(text, title.replace(/\s+/g,"\\s+"));
      if (!clean) return;
      const displayTitle = sectionLabels[title] || title;
      if (y+22>280) { doc.addPage(); y=20; }
      // Draw colored left bar + title
      doc.setFillColor(...color); doc.rect(margin, y, 3, 5, "F");
      doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(...color);
      doc.text(displayTitle, margin+6, y+4.5); y+=8;
      doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(...dark);
      const lines = doc.splitTextToSize(clean, contentW);
      if (y+lines.length*4.5>280) { doc.addPage(); y=20; }
      doc.text(lines, margin, y); y+=lines.length*4.5+7;
    });

    // Contact block — always on same page, never orphaned
    if (y > 260) { doc.addPage(); y=20; }
    doc.setFillColor(...blue); doc.roundedRect(margin,y,contentW,28,3,3,"F");
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("Jean-Baptiste FLECK - Fondateur Aravis Performance", margin+4, y+8);
    doc.setFontSize(8.5); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text("07 64 54 01 58", margin+4, y+15);
    doc.text("jbfleck@aravisperformance.com", margin+4, y+21);
    doc.text("www.aravisperformance.com", margin+80, y+15);
    doc.text("Certifie QUALIOPI - Supply Chain Master", margin+80, y+21);

    const pageCount = doc.internal.getNumberOfPages();
    for (let i=1; i<=pageCount; i++) {
      doc.setPage(i); doc.setFontSize(7); doc.setTextColor(148,163,184);
      doc.text(`Page ${i} / ${pageCount}  -  Aravis Performance  -  Rapport confidentiel`, pageW/2, 292, { align:"center" });
    }
    doc.save(`maturite-supply-chain-${form.entreprise.replace(/\s+/g,"-")}.pdf`);
  };

  // ── INTRO ───────────────────────────────────────────────────────────────────
  if (step==="intro") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={card}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <h1 style={{ fontSize:30, fontWeight:800, color:C1, marginBottom:8, lineHeight:1.2 }}>Auto-évaluation Supply Chain</h1>
            <p style={{ fontSize:16, color:"#475569", fontWeight:500 }}>Quel est le niveau de maturité de votre Supply Chain ?</p>
          </div>
          <div style={{ background:"#eff6ff", borderLeft:`4px solid ${C1}`, borderRadius:"0 10px 10px 0", padding:"18px 20px", marginBottom:20 }}>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:0 }}>Cette auto-évaluation vous permettra de répondre à des questions relatives à votre supply chain. À l'issue du questionnaire, vous disposerez d'un <strong>aperçu sur le niveau potentiel de maturité "Supply Chain" de votre entreprise à titre indicatif</strong>.</p>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}><strong>Ne prenez pas le résultat de ce questionnaire à la lettre.</strong> Un audit complet conduit par un professionnel reste nécessaire pour une analyse rigoureuse, contextualisée à votre stratégie, votre marché et votre organisation. Les audits supply chain du marché contiennent généralement <strong>entre 150 et 200 questions</strong>.</p>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}>À l'issue de ce questionnaire, vous disposerez d'une <strong>notation par chapitre</strong>, d'une <strong>notation globale</strong> et d'un <strong>commentaire de notre expert</strong>.</p>
          </div>
          <div style={{ background:"#f1f5f9", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#475569", display:"flex", gap:10 }}>
            <span style={{ fontSize:18 }}>📋</span>
            <span><strong>18 questions structurantes</strong> réparties sur <strong>9 thématiques</strong>. Comptez <strong>10 à 15 minutes</strong>.</span>
          </div>
          <div style={{ background:"#fff7ed", borderLeft:"4px solid #ea580c", borderRadius:"0 10px 10px 0", padding:"12px 18px", marginBottom:28 }}>
            <p style={{ color:"#9a3412", fontSize:13, lineHeight:1.8, margin:0 }}>⚠️ <strong>Important :</strong> le diagnostic et la feuille de route nécessitent l'intervention d'un expert en situation réelle.</p>
          </div>
          <div style={{ marginBottom:28 }}>
            <h2 style={{ fontSize:16, fontWeight:700, color:C1, marginBottom:14 }}>Les 6 niveaux de maturité Supply Chain</h2>
            {MATURITY_LEVELS.map(l=>(
              <div key={l.level} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 14px", borderRadius:10, background:"#f8fafc", border:"1px solid #e2e8f0", marginBottom:8 }}>
                <div style={{ minWidth:32,height:32,borderRadius:99,background:l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,flexShrink:0,marginTop:2 }}>{l.level}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{l.label}</div>
                  <div style={{ fontSize:13, color:"#475569", lineHeight:1.6, marginTop:2 }}>{l.detail}</div>
                  <div style={{ fontSize:11, color:l.color, fontWeight:600, marginTop:4 }}>{l.keywords}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={btn(true)} onClick={()=>setStep("quiz")}>Démarrer l'auto-évaluation →</button>
        </div>
      </div>
    </div>
  );

  // ── QUIZ ────────────────────────────────────────────────────────────────────
  if (step==="quiz") {
    const q = QUESTIONS[current];
    const pct = Math.round(((current+1)/QUESTIONS.length)*100);
    const tc = [C1,C2,"#7c3aed","#0891b2","#059669","#d97706","#ea580c","#dc2626","#6b21a8"][THEMES.indexOf(q.theme)]||C1;
    return (
      <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
        <Header />
        <div style={{ padding:"0 24px 48px" }}>
          <div style={card}>
            <ProgressBar pct={pct} />
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
              <div style={{ fontSize:12,fontWeight:600,color:tc,textTransform:"uppercase",letterSpacing:1,background:`${tc}15`,padding:"4px 10px",borderRadius:99 }}>{q.theme}</div>
              <span style={{ fontSize:12,color:"#94a3b8" }}>Question {current+1} / {QUESTIONS.length}</span>
            </div>
            <h2 style={{ fontSize:19,fontWeight:600,color:"#0f172a",marginBottom:28,lineHeight:1.5,marginTop:16 }}>{q.q}</h2>
            <div style={{ display:"flex",flexDirection:"column",gap:10 }}>
              {q.options.map((opt,i)=>(
                <button key={i} onClick={()=>handleAnswer(i)}
                  style={{ background:answers[current]===i?`${tc}10`:"#f8fafc",border:`2px solid ${answers[current]===i?tc:"#e2e8f0"}`,borderRadius:10,padding:"12px 16px",textAlign:"left",fontSize:13,color:"#334155",cursor:"pointer",lineHeight:1.6,display:"flex",gap:10,alignItems:"flex-start" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=tc;e.currentTarget.style.background=`${tc}10`;}}
                  onMouseLeave={e=>{if(answers[current]!==i){e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}}>
                  <span style={{ minWidth:22,height:22,borderRadius:99,background:answers[current]===i?tc:"#e2e8f0",color:answers[current]===i?"#fff":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,marginTop:1 }}>{i}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div style={{ display:"flex",gap:10,marginTop:24 }}>
              {current>0&&<button onClick={()=>setCurrent(current-1)} style={{ background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,padding:"12px 20px",fontSize:14,fontWeight:600,cursor:"pointer",flex:1 }}>← Précédent</button>}
              {answers[current]!==undefined&&(
                <button onClick={()=>current<QUESTIONS.length-1?setCurrent(current+1):setStep("form")}
                  style={{ background:tc,color:"#fff",border:"none",borderRadius:8,padding:"12px 20px",fontSize:14,fontWeight:600,cursor:"pointer",flex:2 }}>
                  {current<QUESTIONS.length-1?"Suivant →":"Voir mes résultats →"}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM ────────────────────────────────────────────────────────────────────
  if (step==="form") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:500 }}>
          <ProgressBar pct={100} />
          <h2 style={{ fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:8 }}>Vos coordonnées</h2>
          <p style={{ color:"#64748b",marginBottom:24,fontSize:14,lineHeight:1.7 }}>Un code de vérification vous sera envoyé par email pour accéder à votre rapport personnalisé.</p>
          {[{key:"prenom",label:"Prénom *",type:"text"},{key:"nom",label:"Nom *",type:"text"},{key:"entreprise",label:"Entreprise *",type:"text"},{key:"email",label:"Email professionnel *",type:"email"}].map(f=>(
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                style={{ width:"100%",border:`2px solid ${f.key==="email"&&emailErr?"#dc2626":"#e2e8f0"}`,borderRadius:8,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
            </div>
          ))}
          {emailErr&&<div style={{ color:"#dc2626",fontSize:13,marginBottom:12,padding:"8px 12px",background:"#fef2f2",borderRadius:6 }}>⚠️ {emailErr}</div>}
          <p style={{ fontSize:12,color:"#94a3b8",marginBottom:18 }}>* Champs obligatoires. Données utilisées uniquement dans le cadre de cette auto-évaluation.</p>
          <button style={btn(!!(form.prenom&&form.nom&&form.email&&form.entreprise)&&!codeSending)} onClick={handleFormSubmit} disabled={!(form.prenom&&form.nom&&form.email&&form.entreprise)||codeSending}>
            {codeSending?"⏳ Envoi en cours…":"Recevoir mon code de vérification →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── EMAIL VERIFY ─────────────────────────────────────────────────────────────
  if (step==="email_verify") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:480, textAlign:"center" }}>
          <div style={{ fontSize:52,marginBottom:16 }}>📧</div>
          <h2 style={{ fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:10 }}>Vérifiez votre email</h2>
          <p style={{ color:"#475569",fontSize:14,lineHeight:1.7,marginBottom:24 }}>Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.<br/>Saisissez-le ci-dessous pour accéder à votre rapport.</p>
          <input type="text" maxLength={6} value={codeInput} onChange={e=>{setCodeInput(e.target.value.replace(/\D/g,""));setCodeErr("");}}
            placeholder="_ _ _ _ _ _"
            style={{ width:"100%",border:`2px solid ${codeErr?"#dc2626":"#e2e8f0"}`,borderRadius:10,padding:"14px",fontSize:24,textAlign:"center",letterSpacing:10,outline:"none",boxSizing:"border-box",marginBottom:12,fontWeight:700 }} />
          {codeErr&&<div style={{ color:"#dc2626",fontSize:13,marginBottom:12,padding:"8px 12px",background:"#fef2f2",borderRadius:6 }}>⚠️ {codeErr}</div>}
          <button style={btn(codeInput.length===6)} onClick={handleVerifyCode} disabled={codeInput.length!==6}>Valider et accéder à mon rapport →</button>
          <p style={{ fontSize:12,color:"#94a3b8",marginTop:14 }}>Pas reçu le code ? <span style={{ color:C1,cursor:"pointer" }} onClick={()=>setStep("form")}>Modifier mon email</span></p>
        </div>
      </div>
    </div>
  );

  // ── RESULT ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ maxWidth:760, margin:"0 auto", padding:"0 16px 56px" }}>
        {sheetStatus==="sending"&&<div style={{ background:"#eff6ff",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:C1 }}>📤 Enregistrement en cours…</div>}
        {sheetStatus==="ok"&&<div style={{ background:"#f0fdf4",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#16a34a" }}>✅ Résultats enregistrés.</div>}
        {sheetStatus==="error"&&<div style={{ background:"#fff7ed",borderRadius:10,padding:"10px 16px",marginBottom:16,fontSize:13,color:"#ea580c" }}>⚠️ Erreur d'enregistrement.</div>}

        {/* Score global */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20,textAlign:"center" }}>
          <div style={{ fontSize:13,color:"#64748b",marginBottom:6 }}>Résultats pour <strong>{form.prenom} {form.nom}</strong> — {form.entreprise}</div>
          <h1 style={{ fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:8 }}>Maturité Supply Chain</h1>
          <p style={{ fontSize:12,color:"#94a3b8",fontStyle:"italic",marginBottom:16 }}>Niveau indicatif, basé sur un nombre réduit d'informations et sans analyse du périmètre supply chain.</p>
          <div style={{ display:"inline-block",background:level.color,color:"#fff",borderRadius:99,padding:"10px 28px",fontSize:20,fontWeight:700,marginBottom:12 }}>
            Niveau {avgScore}/5 — {level.label}
          </div>
          <p style={{ color:"#64748b",fontSize:14,margin:"0 0 16px",lineHeight:1.7 }}>{level.detail}</p>
          {/* PDF export note just below score */}
          <div style={{ background:"#eff6ff",borderRadius:8,padding:"10px 16px",fontSize:13,color:C1,marginTop:4,display:"inline-flex",alignItems:"center",gap:8 }}>
            💡 <strong>Ce rapport est exportable en PDF</strong> — bouton rouge en bas de cette page.
          </div>
        </div>

        {/* Niveaux */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:18 }}>Les 6 niveaux de maturité Supply Chain</h2>
          {MATURITY_LEVELS.map(l=>(
            <div key={l.level} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",borderRadius:8,background:Math.round(avgScore)===l.level?`${l.color}18`:"#f8fafc",border:`2px solid ${Math.round(avgScore)===l.level?l.color:"transparent"}`,marginBottom:8 }}>
              <div style={{ minWidth:28,height:28,borderRadius:99,background:l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0,marginTop:2 }}>{l.level}</div>
              <div>
                <span style={{ fontWeight:700,fontSize:13,color:"#0f172a" }}>{l.label}</span>
                {Math.round(avgScore)===l.level&&<span style={{ fontSize:12,color:l.color,fontWeight:600,marginLeft:8 }}>← Votre niveau</span>}
                <div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{l.detail}</div>
                <div style={{ fontSize:11,color:l.color,fontWeight:600,marginTop:4 }}>{l.keywords}</div>
              </div>
            </div>
          ))}
          {/* PDF note after the 6 levels */}
          <div style={{ background:"#eff6ff",borderRadius:8,padding:"10px 16px",fontSize:12,color:C1,marginTop:12,display:"flex",alignItems:"center",gap:8 }}>
            💡 <strong>Ce rapport complet est exportable en PDF</strong> — utilisez le bouton rouge en bas de page.
          </div>
        </div>

        {/* Radar */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:4,textAlign:"center" }}>Radar par thématique</h2>
          <p style={{ textAlign:"center",fontSize:12,color:level.color,fontWeight:600,marginBottom:8 }}>
            Moyenne : {avgScore}/5 — {level.label}
          </p>
          <ResponsiveContainer width="100%" height={480}>
            <RadarChart data={radarData} margin={{ top:55,right:115,bottom:55,left:115 }}>
              <PolarGrid />
              {/* Average-level fill with 40% opacity */}
              <Radar name="Moyenne niveau" dataKey={()=>avgScore}
                stroke="transparent" fill={level.color} fillOpacity={0.18}
                dot={false} legendType="none" />
              <PolarAngleAxis dataKey="theme" tick={(props)=>{
                const {x,y,cx,cy,payload}=props;
                const words=payload.value.split(" ");
                const lines=[]; let curr="";
                words.forEach(w=>{
                  if((curr+" "+w).trim().length>14){if(curr)lines.push(curr);curr=w;}
                  else{curr=(curr+" "+w).trim();}
                });
                if(curr)lines.push(curr);
                const anchor=Math.abs(x-cx)<10?"middle":x>cx?"start":"end";
                return (
                  <text x={x} y={y} textAnchor={anchor} fill="#0f172a" fontSize={11} fontWeight={600}>
                    {lines.map((line,i)=><tspan key={i} x={x} dy={i===0?`-${(lines.length-1)*8}`:"16"}>{line}</tspan>)}
                  </text>
                );
              }}/>
              <PolarRadiusAxis angle={30} domain={[0,5]} tick={{fontSize:9}} tickCount={6}/>
              <Radar name="Score" dataKey="score" stroke={C1} fill={C1} fillOpacity={0.25} strokeWidth={2}/>
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Histogramme */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:4,textAlign:"center" }}>Scores par thématique</h2>
          <p style={{ textAlign:"center",fontSize:12,color:"#dc2626",fontWeight:600,marginBottom:16 }}>— — Moyenne : {avgScore}/5</p>
          <ResponsiveContainer width="100%" height={360}>
            <BarChart data={barData} layout="vertical" margin={{ top:20,right:72,bottom:0,left:172 }}>
              <XAxis type="number" domain={[0,5]} tickCount={6} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="theme" tick={{fontSize:11,fill:"#475569"}} width={167}/>
              <Tooltip formatter={(v)=>[`${v}/5`,"Score"]}/>
              <Bar dataKey="score" radius={[0,6,6,0]}>
                {barData.map((entry,i)=><Cell key={i} fill={getLevel(entry.score).color}/>)}
              </Bar>
              {/* FIX: position label inside so it never clips */}
              <ReferenceLine x={avgScore} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={2}
                label={{ value:`Moy. ${avgScore}`, position:"insideTopRight", fontSize:11, fill:"#dc2626", fontWeight:700, offset:6 }}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:16 }}>
            {MATURITY_LEVELS.map(l=>(
              <div key={l.level} style={{ display:"flex",alignItems:"center",gap:5,fontSize:11,color:"#475569" }}>
                <div style={{ width:12,height:12,borderRadius:3,background:l.color }}/>
                {l.level} — {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Analyse IA — 4 sections */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:20 }}>Analyse personnalisée</h2>
          {loading ? (
            <div style={{ color:"#64748b",fontStyle:"italic",textAlign:"center",padding:32 }}>⏳ Génération de votre analyse en cours…</div>
          ) : aiSections ? (
            <>
              {aiSections.maturityLevel&&(
                <SectionBlock title="Votre niveau de maturité" color={C1} bg="#eff6ff">
                  {cleanSectionText(aiSections.maturityLevel,"VOTRE NIVEAU DE MATURITE","VOTRE NIVEAU DE MATURITÉ")}
                </SectionBlock>
              )}
              {aiSections.strengths&&(
                <SectionBlock title="Points forts" color="#16a34a" bg="#f0fdf4">
                  {cleanSectionText(aiSections.strengths,"POINTS FORTS")}
                </SectionBlock>
              )}
              {aiSections.improvements&&(
                <SectionBlock title="Points d'amélioration" color="#d97706" bg="#fffbeb">
                  {cleanSectionText(aiSections.improvements,"POINTS D'AMELIORATION","POINTS D'AMÉLIORATION")}
                </SectionBlock>
              )}
              {aiSections.recommendations&&(
                <SectionBlock title="Recommandations" color="#7c3aed" bg="#f5f3ff">
                  {cleanSectionText(aiSections.recommendations,"RECOMMANDATIONS")}
                </SectionBlock>
              )}
              {aiSections.nextSteps&&(
                <SectionBlock title="Prochaines étapes" color="#0d9488" bg="#f0fdfa">
                  {cleanSectionText(aiSections.nextSteps,"PROCHAINES ETAPES","PROCHAINES ÉTAPES")}
                </SectionBlock>
              )}
            </>
          ) : (
            <p style={{ color:"#334155",lineHeight:2,fontSize:14,margin:0,whiteSpace:"pre-line" }}>{aiComment}</p>
          )}
        </div>

        {/* Audit Supply Chain — nouveau texte */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:16 }}>Audit Supply Chain</h2>
          {[
            { icon:"🔍", title:"Phase terrain (1 à 10 jours)", items:["Collecte des éléments pour identifier le niveau de maturité et comprendre le fonctionnement actuel de la Supply Chain."] },
            { icon:"📊", title:"Diagnostic", items:["Évaluation complète du niveau de maturité.","Recherche des causes de performance et de non-performance.","Rédaction d'un rapport d'audit complet de plus de 20 pages.","Construction d'une feuille de route avec 3 à 5 projets pour améliorer la maturité de l'entreprise."] },
            { icon:"🎤", title:"Restitution (½ journée)", items:["Présentation des conclusions du rapport d'audit et échanges avec le CODIR."] },
          ].map((phase,i)=>(
            <div key={i} style={{ marginBottom:14,padding:"14px 16px",background:i%2===0?"#f8fafc":"#fff",borderRadius:10,border:"1px solid #e2e8f0" }}>
              <div style={{ display:"flex",gap:10,alignItems:"center",marginBottom:8 }}>
                <span style={{ fontSize:20 }}>{phase.icon}</span>
                <span style={{ fontWeight:700,fontSize:14,color:"#0f172a" }}>{phase.title}</span>
              </div>
              <ul style={{ margin:0,paddingLeft:20 }}>
                {phase.items.map((item,j)=>(
                  <li key={j} style={{ fontSize:13,color:"#475569",lineHeight:1.7,marginBottom:4 }}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Profil JBF */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:18 }}>Votre interlocuteur</h2>
          <div style={{ display:"flex",alignItems:"center",gap:16,marginBottom:20,padding:"14px 18px",background:"#eff6ff",borderRadius:10 }}>
            <div style={{ width:52,height:52,background:C1,borderRadius:99,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
              <span style={{ color:"#fff",fontWeight:800,fontSize:15 }}>JBF</span>
            </div>
            <div>
              <div style={{ fontWeight:700,fontSize:16,color:"#0f172a" }}>Jean-Baptiste FLECK</div>
              <div style={{ fontSize:12,color:"#64748b" }}>Fondateur — Aravis Performance · Certifié QUALIOPI</div>
            </div>
          </div>
          {[
            {icon:"⭐",text:"25 années d'expérience en Supply Chain & Excellence Opérationnelle"},
            {icon:"🔍",text:"Plus de 20 audits-diagnostics menés au cours des 5 dernières années"},
            {icon:"🏅",text:"Auditeur certifié France Supply Chain & Supply Chain Master"},
            {icon:"📋",text:"Maîtrise des référentiels MMOG/LE et Supply Chain Plus"},
            {icon:"🥋",text:"Black Belt Lean 6 Sigma"},
            {icon:"🎓",text:"CPIM — Certified in Planning and Inventory Management"},
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"11px 14px",background:i%2===0?"#f8fafc":"#fff",borderRadius:8,fontSize:14,color:"#1e293b",lineHeight:1.5,marginBottom:6,border:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:18,flexShrink:0 }}>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>

        {/* Contact */}
        <div style={{ background:C1,borderRadius:16,padding:28,marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",marginBottom:8 }}>Envie d'aller plus loin ?</h2>
          <p style={{ color:"#bfdbfe",fontSize:14,lineHeight:1.7,marginBottom:16 }}>Contactez Jean-Baptiste FLECK pour un audit supply chain complet ou ciblé sur une fonction prioritaire.</p>
          <a href="https://calendly.com/jbfleck/30min" target="_blank" rel="noopener noreferrer"
            style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"#fff",color:C1,borderRadius:10,padding:"14px 20px",fontSize:15,fontWeight:700,textDecoration:"none",marginBottom:16,boxShadow:"0 2px 12px rgba(0,0,0,0.18)" }}>
            📅 Prendre rendez-vous avec Jean-Baptiste
          </a>
          <div style={{ background:"rgba(255,255,255,0.15)",borderRadius:10,padding:"16px 20px",display:"flex",flexDirection:"column",gap:10 }}>
            {[{icon:"📞",val:"07 64 54 01 58"},{icon:"✉️",val:"jbfleck@aravisperformance.com"},{icon:"🌐",val:"www.aravisperformance.com"}].map((c,i)=>(
              <div key={i} style={{ fontSize:14,color:"#e0f2fe",display:"flex",gap:10,alignItems:"center" }}>
                <span style={{ fontSize:16 }}>{c.icon}</span><span>{c.val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recontact + Export */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001" }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:16 }}>Télécharger mon rapport PDF</h2>
          <div style={{ background:"#f8fafc",borderRadius:10,padding:"16px 20px",marginBottom:20 }}>
            <p style={{ fontSize:13,fontWeight:600,color:"#374151",marginBottom:4 }}>Souhaitez-vous être recontacté(e) par Aravis Performance ? <span style={{ color:"#dc2626" }}>*</span></p>
            <p style={{ fontSize:12,color:"#94a3b8",marginBottom:14 }}>Une réponse est obligatoire pour télécharger votre rapport.</p>
            <label style={{ display:"flex",alignItems:"center",gap:10,marginBottom:10,cursor:"pointer",fontSize:14,color:"#475569" }}>
              <input type="checkbox" checked={contactPref.none} onChange={()=>handleContactChange("none")} style={{ width:18,height:18,accentColor:C1,cursor:"pointer" }}/>
              🚫 Non, je ne souhaite pas être recontacté(e)
            </label>
            <label style={{ display:"flex",alignItems:"center",gap:10,marginBottom:contactPref.phone?8:10,cursor:"pointer",fontSize:14,color:"#475569" }}>
              <input type="checkbox" checked={contactPref.phone} onChange={()=>handleContactChange("phone")} style={{ width:18,height:18,accentColor:C1,cursor:"pointer" }}/>
              📞 Par téléphone
            </label>
            {contactPref.phone&&(
              <div style={{ marginLeft:28,marginBottom:10 }}>
                <input type="tel" placeholder="Votre numéro de téléphone" value={phoneNumber} onChange={e=>setPhoneNumber(e.target.value)}
                  style={{ width:"100%",border:"2px solid #e2e8f0",borderRadius:8,padding:"9px 12px",fontSize:14,outline:"none",boxSizing:"border-box" }}/>
              </div>
            )}
            <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,color:"#475569",marginBottom:10 }}>
              <input type="checkbox" checked={contactPref.email} onChange={()=>handleContactChange("email")} style={{ width:18,height:18,accentColor:C1,cursor:"pointer" }}/>
              ✉️ Par email ({form.email})
            </label>
            {/* Calendly shortcut */}
            <div style={{ borderTop:"1px solid #e2e8f0",paddingTop:12,marginTop:4 }}>
              <p style={{ fontSize:12,color:"#64748b",marginBottom:8 }}>Ou planifiez directement un créneau :</p>
              <a href="https://calendly.com/jbfleck/30min" target="_blank" rel="noopener noreferrer"
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C1,color:"#fff",borderRadius:8,padding:"11px 16px",fontSize:14,fontWeight:600,textDecoration:"none" }}>
                📅 Prendre rendez-vous via Calendly
              </a>
            </div>
          </div>
          {!contactSelected&&<div style={{ background:"#fef2f2",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626" }}>⚠️ Veuillez sélectionner une option de recontact pour télécharger votre rapport.</div>}

          {/* RED download button */}
          <button onClick={exportResult} disabled={!canDownload}
            style={{ background:canDownload?"#dc2626":"#94a3b8", color:"#fff", border:"none", borderRadius:8,
              padding:"16px 32px", fontSize:16, fontWeight:700,
              cursor:canDownload?"pointer":"not-allowed", width:"100%",
              boxShadow:canDownload?"0 4px 16px rgba(220,38,38,0.45)":"none",
              transition:"all 0.2s" }}>
            ⬇️ Télécharger mon rapport PDF
          </button>
          {contactPref.phone&&!phoneNumber&&<p style={{ fontSize:12,color:"#94a3b8",textAlign:"center",marginTop:8 }}>Merci de saisir votre numéro de téléphone.</p>}
          {loading&&<p style={{ fontSize:12,color:"#64748b",textAlign:"center",marginTop:8 }}>⏳ Analyse en cours de génération, veuillez patienter…</p>}
        </div>
      </div>
    </div>
  );
}
