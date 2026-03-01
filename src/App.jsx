import { useState, useRef } from "react";
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

const C1 = "#0C2F72";
const C2 = "#4472C4";
const LOGO_SRC = "data:image/png;base64,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";

const BLOCKED_DOMAINS = ["gmail.com","googlemail.com","hotmail.com","gmx.com","hotmail.fr","outlook.com","outlook.fr","live.com","live.fr","msn.com","yahoo.com","yahoo.fr","icloud.com","me.com","mac.com","laposte.net","orange.fr","sfr.fr","free.fr","wanadoo.fr","bbox.fr","numericable.fr","aol.com","protonmail.com","proton.me","tutanota.com","gmx.fr","mail.com","yandex.com","zoho.com","fastmail.com"];
const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const isProEmail = (e) => { const d = e.split("@")[1]?.toLowerCase(); return d && !BLOCKED_DOMAINS.includes(d); };

const stripMarkdown = (text) => text
  .replace(/^#{1,4}\s+/gm, '')
  .replace(/\*\*(.*?)\*\*/g, '$1')
  .replace(/\*(.*?)\*/g, '$1')
  .replace(/^[-*]\s+/gm, '')
  .trim();

const hexToRgb = (hex) => [
  parseInt(hex.slice(1,3),16),
  parseInt(hex.slice(3,5),16),
  parseInt(hex.slice(5,7),16)
];

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
  { level: 0, label: "Implicite",   color: "#dc2626", desc: "Aucun processus formalisé. Gestion individuelle, réactive, en silos.", detail: "La Supply Chain repose sur l'expérience individuelle et les habitudes locales. Les décisions sont prises au cas par cas, en réaction aux urgences. Les dysfonctionnements sont acceptés comme une fatalité.", keywords: "Non formalisé · Réactif · Silos · Absence de stratégie" },
  { level: 1, label: "Formalisée",  color: "#ea580c", desc: "Processus documentés par fonction, mais cloisonnés.", detail: "Les processus commencent à être formalisés par fonction (achats, production, logistique) par nécessité. La documentation existe mais reste cloisonnée. Les KPIs locaux sont suivis sans analyse globale.", keywords: "Processus documentés · Silos persistants · KPIs locaux · Réactivité" },
  { level: 2, label: "Maîtrisée",   color: "#d97706", desc: "Processus alignés sur la stratégie globale, début de collaboration.", detail: "Tous les processus sont formalisés et alignés sur une stratégie globale. L'entreprise cherche à stabiliser ses opérations. Un responsable SC est nommé. Les silos commencent à s'atténuer.", keywords: "Processus alignés · KPIs transverses · Stabilisation · Outils centralisés" },
  { level: 3, label: "Intégrée",    color: "#65a30d", desc: "Vision globale, S&OP déployé, collaboration systématique.", detail: "Toutes les fonctions SC travaillent ensemble. Un S&OP synchronise demande et offre. La collaboration est systématique en interne et avec les partenaires. Les outils ERP/WMS/TMS sont intégrés.", keywords: "Collaboration systématique · S&OP · Vision globale · Intégration des outils" },
  { level: 4, label: "Améliorée",   color: "#16a34a", desc: "Amélioration continue, décisions data-driven, centre d'excellence.", detail: "L'entreprise intègre l'amélioration continue dans sa culture SC. Les processus sont optimisés via Lean, Six Sigma, DDMRP. Les décisions sont data-driven. Un centre d'excellence SC capitalise les bonnes pratiques.", keywords: "Amélioration continue · Data-driven · Lean/Six Sigma · Centre d'excellence" },
  { level: 5, label: "Optimisée",   color: "#0d9488", desc: "Centre de profit différenciant, IA/IoT, visibilité end-to-end.", detail: "La SC est perçue comme un centre de profit différenciant. Les technologies avancées (IA, IoT, blockchain) sont intégrées. Les processus sont auto-optimisés. Les services logistiques sont monétisés.", keywords: "Centre de profit · IA/IoT/Blockchain · Visibilité end-to-end · Monétisation" },
];

const getLevel = (s) => MATURITY_LEVELS.find(l => l.level === Math.min(Math.round(s), 5)) || MATURITY_LEVELS[0];

const Logo = () => <img src={LOGO_SRC} alt="Aravis Performance" style={{ height: 52, objectFit: "contain" }} />;
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
const btn = (active) => ({ background: active ? C1 : "#94a3b8", color: "#fff", border: "none", borderRadius: 8, padding: "14px 32px", fontSize: 15, fontWeight: 600, cursor: active ? "pointer" : "not-allowed", width: "100%" });

// ── PDF Helpers ──────────────────────────────────────────────────────────────
const drawRadarPDF = (doc, cx, cy, radius, themeScores) => {
  const n = themeScores.length;
  const step = (2 * Math.PI) / n;

  // Grid rings
  for (let ring = 1; ring <= 5; ring++) {
    const pts = themeScores.map((_, i) => {
      const a = i * step - Math.PI / 2;
      return [cx + (radius * ring / 5) * Math.cos(a), cy + (radius * ring / 5) * Math.sin(a)];
    });
    doc.setDrawColor(210, 210, 210); doc.setLineWidth(0.3);
    for (let i = 0; i < n; i++) {
      doc.line(pts[i][0], pts[i][1], pts[(i+1)%n][0], pts[(i+1)%n][1]);
    }
    doc.setFontSize(6); doc.setTextColor(160, 160, 160);
    doc.text(`${ring}`, cx + 1, cy - radius * ring / 5 + 2);
  }
  // Axes
  themeScores.forEach((_, i) => {
    const a = i * step - Math.PI / 2;
    doc.setDrawColor(200, 200, 200); doc.setLineWidth(0.2);
    doc.line(cx, cy, cx + radius * Math.cos(a), cy + radius * Math.sin(a));
  });
  // Data polygon
  const pts = themeScores.map((d, i) => {
    const a = i * step - Math.PI / 2;
    const r = radius * d.score / 5;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  doc.setDrawColor(12, 47, 114); doc.setLineWidth(1.5);
  for (let i = 0; i < pts.length; i++) {
    doc.line(pts[i][0], pts[i][1], pts[(i+1)%pts.length][0], pts[(i+1)%pts.length][1]);
  }
  // Dots on vertices
  pts.forEach(([x, y]) => {
    doc.setFillColor(12, 47, 114);
    doc.circle(x, y, 1.2, 'F');
  });
  // Labels — FULL names, multi-line, generous offset
  doc.setFontSize(7.5); doc.setTextColor(30, 30, 30); doc.setFont("helvetica", "bold");
  themeScores.forEach((d, i) => {
    const a = i * step - Math.PI / 2;
    const labelOffset = radius + 20;
    const lx = cx + labelOffset * Math.cos(a);
    const ly = cy + labelOffset * Math.sin(a);
    const align = Math.abs(lx - cx) < 8 ? 'center' : lx > cx ? 'left' : 'right';

    // Split label into max 2 lines of ~15 chars each
    const words = d.theme.split(" ");
    const lines = [];
    let current = "";
    words.forEach(w => {
      if ((current + " " + w).trim().length > 15) {
        if (current) lines.push(current);
        current = w;
      } else {
        current = (current + " " + w).trim();
      }
    });
    if (current) lines.push(current);

    const lineHeight = 4;
    const startY = ly - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, li) => {
      doc.text(line, lx, startY + li * lineHeight, { align });
    });
  });
  doc.setFont("helvetica", "normal");
};

const drawBarChartPDF = (doc, startX, startY, chartW, barData, avgScore) => {
  const barH = 8;
  const gap = 4;
  const labelW = 58;
  const scoreW = 12;
  const barAreaW = chartW - labelW - scoreW - 4;
  const avgLineX = startX + labelW + (barAreaW * avgScore / 5);

  // Total chart height
  const totalH = barData.length * (barH + gap);

  // Avg line (red dashed)
  doc.setDrawColor(220, 38, 38); doc.setLineWidth(0.8);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(avgLineX, startY - 8, avgLineX, startY + totalH);
  doc.setLineDashPattern([], 0);
  // Avg label at top
  doc.setFontSize(7); doc.setTextColor(220, 38, 38); doc.setFont("helvetica", "bold");
  doc.text(`Moy. ${avgScore}`, avgLineX + 1, startY - 10);
  doc.setFont("helvetica", "normal");

  // Bars
  barData.forEach((item, i) => {
    const y = startY + i * (barH + gap);
    const bw = Math.max(2, (barAreaW * item.score) / 5);
    const rgb = hexToRgb(getLevel(item.score).color);

    // Label — full name, may wrap to 2 lines
    doc.setFontSize(7); doc.setTextColor(70, 70, 70);
    const words = item.theme.split(" ");
    const lines = [];
    let curr = "";
    words.forEach(w => {
      if ((curr + " " + w).trim().length > 18) {
        if (curr) lines.push(curr);
        curr = w;
      } else {
        curr = (curr + " " + w).trim();
      }
    });
    if (curr) lines.push(curr);

    if (lines.length === 1) {
      doc.text(lines[0], startX, y + barH - 1);
    } else {
      doc.text(lines[0], startX, y + 3);
      doc.text(lines[1] || "", startX, y + barH);
    }

    // Bar
    doc.setFillColor(...rgb);
    doc.roundedRect(startX + labelW, y, bw, barH, 1.5, 1.5, 'F');

    // Score label — always to the right of bar, with padding
    doc.setFontSize(7); doc.setTextColor(30, 30, 30);
    doc.text(`${item.score}`, startX + labelW + bw + 3, y + barH - 1);
  });

  // Legend
  const legendY = startY + totalH + 8;
  let lx = startX;
  MATURITY_LEVELS.forEach(l => {
    const rgb = hexToRgb(l.color);
    doc.setFillColor(...rgb);
    doc.rect(lx, legendY, 4, 4, 'F');
    doc.setFontSize(6); doc.setTextColor(60, 60, 60);
    doc.text(`${l.level}-${l.label}`, lx + 5, legendY + 3.5);
    lx += 32;
    if (lx > startX + chartW - 10) { lx = startX; }
  });
};

// ── APP ─────────────────────────────────────────────────────────────────────
export default function App() {
  const [step, setStep]               = useState("intro");
  const [answers, setAnswers]         = useState({});
  const [current, setCurrent]         = useState(0);
  const [form, setForm]               = useState({ prenom: "", nom: "", email: "", entreprise: "" });
  const [emailErr, setEmailErr]       = useState("");
  const [codeInput, setCodeInput]     = useState("");
  const [codeErr, setCodeErr]         = useState("");
  const [codeSending, setCodeSending] = useState(false);
  const [aiComment, setAiComment]     = useState("");
  const [loading, setLoading]         = useState(false);
  const [sheetStatus, setSheetStatus] = useState("idle");
  const [contactPref, setContactPref] = useState({ none: false, phone: false, email: false });
  const [phoneNumber, setPhoneNumber] = useState("");

  const contactSelected = contactPref.none || contactPref.phone || contactPref.email;

  const handleContactChange = (key) => {
    if (key === "none") setContactPref({ none: true, phone: false, email: false });
    else setContactPref(prev => ({ ...prev, none: false, [key]: !prev[key] }));
  };

  const qScore = (i) => answers[i] ?? 0;
  const themeScore = (theme) => {
    const idxs = QUESTIONS.map((q,i) => q.theme === theme ? i : -1).filter(i => i >= 0);
    return Math.round(idxs.reduce((a,i) => a + qScore(i), 0) / idxs.length * 10) / 10;
  };
  const avgScore = Math.round(THEMES.reduce((a,t) => a + themeScore(t), 0) / THEMES.length * 10) / 10;
  const level = getLevel(avgScore);
  const radarData = THEMES.map(t => ({ theme: t, score: themeScore(t), fullMark: 5 }));
  const barData = [...THEMES.map(t => ({ theme: t, score: themeScore(t) }))].sort((a,b) => a.score - b.score);

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
      await fetch(WEBHOOK_SEND_CODE, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body: JSON.stringify({ email: form.email, prenom: form.prenom }) });
      setStep("email_verify");
      generateComment();
    } catch { setEmailErr("Erreur lors de l'envoi du code. Veuillez réessayer."); }
    setCodeSending(false);
  };

  const handleVerifyCode = async () => {
    setCodeErr("");
    try {
      await fetch(WEBHOOK_CHECK_CODE, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body: JSON.stringify({ email: form.email, code: codeInput.trim() }) });
      setStep("result");
    } catch { setCodeErr("Erreur de vérification. Veuillez réessayer."); }
  };

  const generateComment = async () => {
    setLoading(true);
    const ctx = THEMES.map(t => `${t} : ${themeScore(t)}/5`).join(", ");
    const prompt = `Tu es Jean-Baptiste Fleck, consultant expert en supply chain, fondateur d'Aravis Performance, certifié Qualiopi, 25 ans d'expérience, plus de 20 audits-diagnostics réalisés.

Un dirigeant de PME industrielle vient de réaliser une auto-évaluation de la maturité de sa supply chain.
Résultats par thématique : ${ctx}
Score global : ${avgScore}/5 — Niveau : ${level.label} — ${level.desc}

Rédige une analyse en EXACTEMENT 3 paragraphes séparés par une ligne vide.
RÈGLES ABSOLUES :
- TEXTE BRUT UNIQUEMENT. Aucun markdown, aucun #, aucun **, aucun tiret de liste.
- Chaque phrase fait MAXIMUM 18 mots.
- Reviens à la ligne après CHAQUE phrase (une phrase = une ligne).
- MAXIMUM 450 mots au total.
- Ton direct, expert, bienveillant.

PARAGRAPHE 1 — Points forts (6 à 8 phrases) :
Identifie les 2 ou 3 thématiques avec les meilleurs scores.
Valorise ce qui fonctionne bien de façon concrète.
Mentionne les pratiques solides observées.

PARAGRAPHE 2 — Axes de progrès prioritaires (6 à 8 phrases) :
Identifie les 2 ou 3 thématiques avec les scores les plus faibles.
Propose deux ou trois pistes concrètes d'amélioration.
Sois précis sur les actions à engager en priorité.

PARAGRAPHE 3 — Invitation à l'audit (5 à 7 phrases) :
Rappelle que cette auto-évaluation est déclarative et indicative.
Un audit terrain révèle souvent des écarts significatifs avec la perception interne.
Mentionne les gains potentiels typiquement observés après un audit-diagnostic complet :
- Performance de livraison : +15 à +30%
- Réduction des stocks : 25 à 40%
- Fiabilité des prévisions : +25 à +70%
- Productivité : +10 à +20%
- Capacité de production : +10 à +20%
- Réduction des coûts logistiques : 25 à 40%
Invite chaleureusement à contacter Aravis Performance pour un audit complet ou ciblé sur une fonction prioritaire.`;

    try {
      const res = await fetch(WORKER_AI_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, max_tokens: 3500 })
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setAiComment(stripMarkdown(data.comment || "Commentaire indisponible."));
    } catch { setAiComment("Erreur lors de la génération du commentaire."); }
    setLoading(false);
  };

  const sendNotification = async () => {
    if (!WEBHOOK_NOTIFY) return;
    try {
      await fetch(WEBHOOK_NOTIFY, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body: JSON.stringify({
        date: new Date().toLocaleString("fr-FR"), prenom: form.prenom, nom: form.nom,
        entreprise: form.entreprise, email: form.email, score_global: avgScore, niveau: level.label,
        recontact_tel: contactPref.phone ? "Oui" : "Non", telephone: contactPref.phone ? phoneNumber : "",
        recontact_email: contactPref.email ? "Oui" : "Non",
      })});
    } catch {}
  };

  const sendToSheets = async () => {
    if (!WEBHOOK_SHEETS) { setSheetStatus("error"); return; }
    setSheetStatus("sending");
    const payload = {
      date: new Date().toLocaleString("fr-FR"), prenom: form.prenom, nom: form.nom,
      entreprise: form.entreprise, email: form.email, score_global: avgScore, niveau: level.label,
      recontact_non: contactPref.none ? "Oui" : "Non",
      recontact_tel: contactPref.phone ? "Oui" : "Non",
      recontact_telephone_numero: contactPref.phone ? phoneNumber : "",
      recontact_email: contactPref.email ? "Oui" : "Non",
      ...Object.fromEntries(QUESTIONS.flatMap((q,i) => {
        const key = `Q${i+1}`;
        return [[`${key}_theme`, q.theme],[`${key}_reponse`, q.options[qScore(i)]],[`${key}_score`, qScore(i)]];
      })),
      ...Object.fromEntries(THEMES.map(t => [`score_${t.replace(/[^a-zA-Z]/g,"_").toLowerCase()}`, themeScore(t)])),
      commentaire_ia: aiComment,
    };
    try {
      await fetch(WEBHOOK_SHEETS, { method:"POST", mode:"no-cors", headers:{"Content-Type":"text/plain"}, body: JSON.stringify(payload) });
      setSheetStatus("ok");
    } catch { setSheetStatus("error"); }
  };

  const exportResult = async () => {
    await sendToSheets();
    if (contactPref.phone || contactPref.email) await sendNotification();

    const doc = new jsPDF({ orientation:"portrait", unit:"mm", format:"a4" });
    const blue = [12,47,114]; const dark = [15,23,42]; const gray = [71,85,105];
    const lightBlue = [239,246,255];
    const pageW = 210; const margin = 20; const contentW = pageW - margin*2;

    // ── PAGE 1 : En-tête + Identité + Score + Niveaux ─────────────────────
    // Header band — taller to fit contact info
    doc.setFillColor(...blue); doc.rect(0,0,pageW,38,"F");

    // Company name
    doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("Aravis Performance", margin, 10);

    // Report title — same font size as company name
    doc.setFontSize(16); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    const reportTitle = `Rapport de maturite simplifie de la supply chain de : ${form.entreprise}`;
    const titleLines = doc.splitTextToSize(reportTitle, contentW);
    doc.text(titleLines, margin, 19);

    // Contact info in header
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text("07 64 54 01 58  |  jbfleck@aravisperformance.com  |  www.aravisperformance.com", margin, 34);

    let y = 46;

    // Thank you message
    doc.setFillColor(239,246,255); doc.roundedRect(margin, y, contentW, 10, 2, 2, "F");
    doc.setFontSize(8.5); doc.setFont("helvetica","italic"); doc.setTextColor(...blue);
    const thankMsg = `Merci d'avoir teste cet outil d'auto-evaluation qui vous permet de vous engager dans une recherche d'amelioration de la performance de votre supply chain.`;
    const thankLines = doc.splitTextToSize(thankMsg, contentW - 8);
    doc.text(thankLines, margin + 4, y + 4.5);
    y += thankLines.length > 1 ? 16 : 14;

    // Identité
    doc.setFillColor(...lightBlue); doc.roundedRect(margin,y,contentW,20,3,3,"F");
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text(`${form.prenom} ${form.nom}`, margin+4, y+7);
    doc.setFont("helvetica","normal"); doc.setFontSize(9); doc.setTextColor(...gray);
    doc.text(`${form.entreprise}  —  ${form.email}`, margin+4, y+13);
    doc.text(`Date : ${new Date().toLocaleDateString("fr-FR")}`, margin+4, y+19);
    y += 26;

    // Score global
    doc.setFillColor(...blue); doc.roundedRect(margin,y,contentW/2-3,20,3,3,"F");
    doc.setFontSize(20); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(`${avgScore}/5`, margin+5, y+13);
    doc.setFontSize(8); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text("Score global", margin+5, y+19);
    doc.setFillColor(248,250,252); doc.roundedRect(margin+contentW/2+3,y,contentW/2-3,20,3,3,"F");
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text(level.label, margin+contentW/2+7, y+12);
    doc.setFontSize(7); doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
    const descLines = doc.splitTextToSize(level.desc, contentW/2-10);
    doc.text(descLines, margin+contentW/2+7, y+18);
    y += 26;

    // Mention indicatif
    doc.setFontSize(7); doc.setFont("helvetica","italic"); doc.setTextColor(...gray);
    doc.text("Niveau indicatif base sur un nombre reduit d'informations et sans analyse complete du perimetre supply chain.", margin, y); y += 7;

    // Niveaux de maturité avec DETAIL complet
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Les 6 niveaux de maturite Supply Chain", margin, y); y += 4;

    MATURITY_LEVELS.forEach(l => {
      const rgb = hexToRgb(l.color);
      const isCurrent = Math.round(avgScore) === l.level;

      // Calculate height needed for this level (detail text can wrap)
      const detailLines = doc.splitTextToSize(l.detail, contentW - 52);
      const keywordLines = doc.splitTextToSize(l.keywords, contentW - 52);
      const blockH = Math.max(14, 5 + detailLines.length * 4 + keywordLines.length * 3.5 + 4);

      // Check page break
      if (y + blockH > 285) { doc.addPage(); y = 20; }

      if (isCurrent) {
        doc.setFillColor(...rgb);
        doc.setFillColor(rgb[0], rgb[1], rgb[2]);
        doc.roundedRect(margin, y, contentW, blockH, 2, 2, "F");
      } else {
        doc.setFillColor(248, 250, 252);
        doc.roundedRect(margin, y, contentW, blockH, 2, 2, "F");
      }

      // Colored circle
      doc.setFillColor(...rgb);
      doc.circle(margin + 5, y + blockH/2, 4, "F");

      // Level number + label
      doc.setFontSize(9); doc.setFont("helvetica","bold");
      doc.setTextColor(isCurrent ? 255 : 30, isCurrent ? 255 : 30, isCurrent ? 255 : 30);
      doc.text(`${l.level} — ${l.label}`, margin + 13, y + 5.5);

      if (isCurrent) {
        doc.setFontSize(8); doc.setFont("helvetica","bold");
        doc.setTextColor(255, 255, 255);
        doc.text("← VOTRE NIVEAU", margin + contentW - 34, y + 5.5);
      }

      // Full detail text
      doc.setFontSize(7.5); doc.setFont("helvetica","normal");
      doc.setTextColor(isCurrent ? 245 : 70, isCurrent ? 245 : 70, isCurrent ? 245 : 70);
      doc.text(detailLines, margin + 13, y + 11);

      // Keywords
      const kwY = y + 11 + detailLines.length * 4 + 1;
      doc.setFontSize(6.5); doc.setFont("helvetica","bold");
      doc.setTextColor(isCurrent ? 220 : rgb[0], isCurrent ? 220 : rgb[1], isCurrent ? 220 : rgb[2]);
      doc.text(keywordLines, margin + 13, kwY);

      y += blockH + 3;
    });

    // ── PAGE 2 : Scores par thématique + Radar + Histogramme ───────────────
    doc.addPage(); y = 20;

    // Tableau scores
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Scores par thematique", margin, y); y += 4;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [["Thematique","Score","Niveau"]],
      body: THEMES.map(t => { const s = themeScore(t); return [t, `${s} / 5`, getLevel(s).label]; }),
      styles: { fontSize: 9, cellPadding: 3 },
      headStyles: { fillColor: blue, textColor: 255, fontStyle:"bold" },
      alternateRowStyles: { fillColor:[248,250,252] },
      columnStyles: { 0:{cellWidth:90}, 1:{cellWidth:25,halign:"center"}, 2:{cellWidth:45,halign:"center"} },
    });
    y = doc.lastAutoTable.finalY + 10;

    // Radar — on new page if not enough space
    if (y + 130 > 280) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Radar par thematique", margin, y); y += 4;

    // Wider radar with more label space
    const radarData_pdf = THEMES.map(t => ({ theme: t, score: themeScore(t) }));
    const cx = pageW/2;
    const cy = y + 58;
    const radarR = 44;
    drawRadarPDF(doc, cx, cy, radarR, radarData_pdf);
    y = cy + radarR + 28;

    // Histogramme — on new page if not enough space
    if (y + barData.length * 14 + 40 > 280) { doc.addPage(); y = 20; }
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Scores par thematique (classement)", margin, y); y += 8;
    const barData_pdf = [...THEMES.map(t => ({ theme: t, score: themeScore(t) }))].sort((a,b) => a.score-b.score);
    drawBarChartPDF(doc, margin, y, contentW, barData_pdf, avgScore);
    y += barData_pdf.length * 13 + 24;

    // ── PAGE 3 : Détail des réponses ────────────────────────────────────────
    doc.addPage(); y = 20;
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Detail des reponses", margin, y); y += 4;
    autoTable(doc, {
      startY: y, margin: { left: margin, right: margin },
      head: [["#","Thematique","Reponse selectionnee","Niv."]],
      body: QUESTIONS.map((q,i) => [`Q${i+1}`, q.theme, q.options[qScore(i)], qScore(i)]),
      styles: { fontSize:7.5, cellPadding:2, overflow:"linebreak" },
      headStyles: { fillColor:blue, textColor:255, fontStyle:"bold" },
      alternateRowStyles: { fillColor:[248,250,252] },
      columnStyles: { 0:{cellWidth:10,halign:"center"}, 1:{cellWidth:38}, 2:{cellWidth:105}, 3:{cellWidth:10,halign:"center"} },
    });

    // ── PAGE 4 : Analyse personnalisée ──────────────────────────────────────
    doc.addPage(); y = 20;
    doc.setFillColor(...lightBlue); doc.roundedRect(margin,y,contentW,8,2,2,"F");
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Analyse personnalisee", margin+4, y+5.5); y += 14;
    doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...dark);
    const commentLines = doc.splitTextToSize(aiComment, contentW);
    doc.text(commentLines, margin, y); y += commentLines.length * 5 + 14;

    // Contact
    if (y > 240) { doc.addPage(); y = 20; }
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
      doc.text(`Page ${i} / ${pageCount}  —  Aravis Performance  —  Rapport confidentiel`, pageW/2, 292, { align:"center" });
    }
    doc.save(`maturite-supply-chain-${form.entreprise.replace(/\s+/g,"-")}.pdf`);
  };

  // ── INTRO ────────────────────────────────────────────────────────────────
  if (step === "intro") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={card}>
          <div style={{ textAlign:"center", marginBottom:24 }}>
            <h1 style={{ fontSize:32, fontWeight:800, color:C1, marginBottom:8, lineHeight:1.2 }}>Auto-évaluation Supply Chain</h1>
            <p style={{ fontSize:17, color:"#475569", fontWeight:500 }}>Quel est le niveau de maturité de votre Supply Chain ?</p>
          </div>
          <div style={{ background:"#eff6ff", borderLeft:`4px solid ${C1}`, borderRadius:"0 10px 10px 0", padding:"18px 20px", marginBottom:20 }}>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:0 }}>
              Cette auto-évaluation vous permettra de répondre à des questions relatives à votre supply chain. À l'issue du questionnaire, vous disposerez d'un <strong>aperçu sur le niveau potentiel de maturité "Supply Chain" de votre entreprise à titre indicatif</strong>.
            </p>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}>
              <strong>Ne prenez pas le résultat de ce questionnaire à la lettre.</strong> Un audit complet conduit par un professionnel reste nécessaire pour une analyse rigoureuse, contextualisée à votre stratégie, votre marché et votre organisation. Les audits supply chain du marché contiennent généralement <strong>entre 150 et 200 questions</strong>. Notre audit du processus S&OP seul comprend plus de 200 questions.
            </p>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}>
              À l'issue de ce questionnaire, vous disposerez d'une <strong>notation par chapitre</strong>, d'une <strong>notation globale</strong> et d'un <strong>commentaire de notre expert</strong>.
            </p>
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
            {MATURITY_LEVELS.map(l => (
              <div key={l.level} style={{ display:"flex", gap:12, alignItems:"flex-start", padding:"12px 14px", borderRadius:10, background:"#f8fafc", border:"1px solid #e2e8f0", marginBottom:8 }}>
                <div style={{ minWidth:32, height:32, borderRadius:99, background:l.color, color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0, marginTop:2 }}>{l.level}</div>
                <div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#0f172a" }}>{l.label}</div>
                  <div style={{ fontSize:13, color:"#475569", lineHeight:1.6, marginTop:2 }}>{l.detail}</div>
                  <div style={{ fontSize:11, color:l.color, fontWeight:600, marginTop:4 }}>{l.keywords}</div>
                </div>
              </div>
            ))}
          </div>
          <button style={btn(true)} onClick={() => setStep("quiz")}>Démarrer l'auto-évaluation →</button>
        </div>
      </div>
    </div>
  );

  // ── QUIZ ─────────────────────────────────────────────────────────────────
  if (step === "quiz") {
    const q = QUESTIONS[current];
    const pct = Math.round(((current+1)/QUESTIONS.length)*100);
    const tc = [C1,C2,"#7c3aed","#0891b2","#059669","#d97706","#ea580c","#dc2626","#6b21a8"][THEMES.indexOf(q.theme)] || C1;
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
                  style={{ background:answers[current]===i?`${tc}10`:"#f8fafc", border:`2px solid ${answers[current]===i?tc:"#e2e8f0"}`, borderRadius:10, padding:"12px 16px", textAlign:"left", fontSize:13, color:"#334155", cursor:"pointer", lineHeight:1.6, display:"flex", gap:10, alignItems:"flex-start" }}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=tc;e.currentTarget.style.background=`${tc}10`;}}
                  onMouseLeave={e=>{if(answers[current]!==i){e.currentTarget.style.borderColor="#e2e8f0";e.currentTarget.style.background="#f8fafc";}}}>
                  <span style={{ minWidth:22,height:22,borderRadius:99,background:answers[current]===i?tc:"#e2e8f0",color:answers[current]===i?"#fff":"#64748b",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,flexShrink:0,marginTop:1 }}>{i}</span>
                  <span>{opt}</span>
                </button>
              ))}
            </div>
            <div style={{ display:"flex", gap:10, marginTop:24 }}>
              {current>0 && <button onClick={()=>setCurrent(current-1)} style={{ background:"#f1f5f9",color:"#475569",border:"none",borderRadius:8,padding:"12px 20px",fontSize:14,fontWeight:600,cursor:"pointer",flex:1 }}>← Précédent</button>}
              {answers[current]!==undefined && (
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

  // ── FORM ─────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:500 }}>
          <ProgressBar pct={100} />
          <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:8 }}>Vos coordonnées</h2>
          <p style={{ color:"#64748b", marginBottom:24, fontSize:14, lineHeight:1.7 }}>Un code de vérification vous sera envoyé par email pour accéder à votre rapport personnalisé.</p>
          {[{key:"prenom",label:"Prénom *",type:"text"},{key:"nom",label:"Nom *",type:"text"},{key:"entreprise",label:"Entreprise *",type:"text"},{key:"email",label:"Email professionnel *",type:"email"}].map(f => (
            <div key={f.key} style={{ marginBottom:14 }}>
              <label style={{ fontSize:13,fontWeight:600,color:"#374151",display:"block",marginBottom:5 }}>{f.label}</label>
              <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:e.target.value})}
                style={{ width:"100%",border:`2px solid ${f.key==="email"&&emailErr?"#dc2626":"#e2e8f0"}`,borderRadius:8,padding:"10px 14px",fontSize:14,outline:"none",boxSizing:"border-box" }} />
            </div>
          ))}
          {emailErr && <div style={{ color:"#dc2626",fontSize:13,marginBottom:12,padding:"8px 12px",background:"#fef2f2",borderRadius:6 }}>⚠️ {emailErr}</div>}
          <p style={{ fontSize:12,color:"#94a3b8",marginBottom:18 }}>* Champs obligatoires. Données utilisées uniquement dans le cadre de cette auto-évaluation.</p>
          <button style={btn(!!(form.prenom&&form.nom&&form.email&&form.entreprise)&&!codeSending)} onClick={handleFormSubmit} disabled={!(form.prenom&&form.nom&&form.email&&form.entreprise)||codeSending}>
            {codeSending?"⏳ Envoi en cours…":"Recevoir mon code de vérification →"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── EMAIL VERIFY ─────────────────────────────────────────────────────────
  if (step === "email_verify") return (
    <div style={{ minHeight:"100vh", background:"#f8fafc" }}>
      <Header />
      <div style={{ padding:"0 24px 48px" }}>
        <div style={{ ...card, maxWidth:480, textAlign:"center" }}>
          <div style={{ fontSize:52, marginBottom:16 }}>📧</div>
          <h2 style={{ fontSize:22, fontWeight:700, color:"#0f172a", marginBottom:10 }}>Vérifiez votre email</h2>
          <p style={{ color:"#475569", fontSize:14, lineHeight:1.7, marginBottom:24 }}>
            Un code à 6 chiffres a été envoyé à <strong>{form.email}</strong>.<br/>Saisissez-le ci-dessous pour accéder à votre rapport.
          </p>
          <input type="text" maxLength={6} value={codeInput} onChange={e=>{setCodeInput(e.target.value.replace(/\D/g,""));setCodeErr("");}}
            placeholder="_ _ _ _ _ _"
            style={{ width:"100%",border:`2px solid ${codeErr?"#dc2626":"#e2e8f0"}`,borderRadius:10,padding:"14px",fontSize:24,textAlign:"center",letterSpacing:10,outline:"none",boxSizing:"border-box",marginBottom:12,fontWeight:700 }} />
          {codeErr && <div style={{ color:"#dc2626",fontSize:13,marginBottom:12,padding:"8px 12px",background:"#fef2f2",borderRadius:6 }}>⚠️ {codeErr}</div>}
          <button style={btn(codeInput.length===6)} onClick={handleVerifyCode} disabled={codeInput.length!==6}>Valider et accéder à mon rapport →</button>
          <p style={{ fontSize:12,color:"#94a3b8",marginTop:14 }}>Pas reçu le code ? <span style={{ color:C1,cursor:"pointer" }} onClick={()=>setStep("form")}>Modifier mon email</span></p>
        </div>
      </div>
    </div>
  );

  // ── RESULT ───────────────────────────────────────────────────────────────
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
          <p style={{ fontSize:12,color:"#94a3b8",fontStyle:"italic",marginBottom:16 }}>Niveau de maturité donné à titre indicatif sur la base d'un nombre réduit d'informations et sans analyse du périmètre de la supply chain de votre entreprise.</p>
          <div style={{ display:"inline-block",background:level.color,color:"#fff",borderRadius:99,padding:"10px 28px",fontSize:20,fontWeight:700,marginBottom:12 }}>
            Niveau {avgScore}/5 — {level.label}
          </div>
          <p style={{ color:"#64748b",fontSize:14,margin:0,lineHeight:1.7 }}>{level.detail}</p>
        </div>

        {/* Niveaux */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:18 }}>Les 6 niveaux de maturité Supply Chain</h2>
          {MATURITY_LEVELS.map(l => (
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
        </div>

        {/* Radar */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:20,textAlign:"center" }}>Radar par thématique</h2>
          <ResponsiveContainer width="100%" height={460}>
            <RadarChart data={radarData} margin={{ top:50,right:100,bottom:50,left:100 }}>
              <PolarGrid />
              <PolarAngleAxis dataKey="theme" tick={(props) => {
                const {x,y,cx,cy,payload} = props;
                const words = payload.value.split(" ");
                const lines=[]; let curr="";
                words.forEach(w => {
                  if((curr+" "+w).trim().length>14){if(curr)lines.push(curr);curr=w;}
                  else{curr=(curr+" "+w).trim();}
                });
                if(curr)lines.push(curr);
                const anchor = Math.abs(x-cx)<10?"middle":x>cx?"start":"end";
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
          <ResponsiveContainer width="100%" height={340}>
            <BarChart data={barData} layout="vertical" margin={{ top:10,right:60,bottom:0,left:160 }}>
              <XAxis type="number" domain={[0,5]} tickCount={6} tick={{fontSize:10}}/>
              <YAxis type="category" dataKey="theme" tick={{fontSize:11,fill:"#475569"}} width={155}/>
              <Tooltip formatter={(v)=>[`${v}/5`,"Score"]}/>
              <Bar dataKey="score" radius={[0,6,6,0]}>
                {barData.map((entry,i)=><Cell key={i} fill={getLevel(entry.score).color}/>)}
              </Bar>
              <ReferenceLine x={avgScore} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={2}
                label={{ value:`Moy. ${avgScore}`, position:"top", fontSize:11, fill:"#dc2626", fontWeight:700 }}/>
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

        {/* Analyse IA */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:16 }}>Analyse personnalisée</h2>
          {loading
            ?<div style={{ color:"#64748b",fontStyle:"italic",textAlign:"center",padding:32 }}>⏳ Génération de votre analyse en cours…</div>
            :<p style={{ color:"#334155",lineHeight:2,fontSize:14,margin:0,whiteSpace:"pre-line" }}>{aiComment}</p>}
        </div>

        {/* Audit info */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:14 }}>Qu'est-ce qu'un audit supply chain ?</h2>
          <p style={{ color:"#475569",fontSize:14,lineHeight:1.9,marginBottom:14 }}>
            Pour un audit en situation réelle, il faut compter <strong>entre 1 et 10 jours selon la taille de l'entreprise</strong>. L'expert réalise l'audit-diagnostic et construit la feuille de route, restituée au <strong>CODIR</strong>.
          </p>
          <div style={{ background:"#fefce8",borderLeft:"4px solid #ca8a04",borderRadius:"0 10px 10px 0",padding:"14px 18px" }}>
            <p style={{ color:"#713f12",fontSize:13,lineHeight:1.8,margin:0 }}>
              <strong>⚖️ Indépendance et impartialité de l'auditeur</strong><br/>
              L'auditeur ne propose pas ses services pour la mise en œuvre de la feuille de route afin d'éviter tout conflit d'intérêt.
            </p>
          </div>
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
          <p style={{ color:"#bfdbfe",fontSize:14,lineHeight:1.7,marginBottom:20 }}>Contactez Jean-Baptiste FLECK pour un audit supply chain complet ou ciblé sur une fonction prioritaire.</p>
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
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:16 }}>Télécharger mon rapport</h2>
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
            <label style={{ display:"flex",alignItems:"center",gap:10,cursor:"pointer",fontSize:14,color:"#475569" }}>
              <input type="checkbox" checked={contactPref.email} onChange={()=>handleContactChange("email")} style={{ width:18,height:18,accentColor:C1,cursor:"pointer" }}/>
              ✉️ Par email ({form.email})
            </label>
          </div>
          {!contactSelected&&<div style={{ background:"#fef2f2",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626" }}>⚠️ Veuillez sélectionner une option de recontact pour télécharger votre rapport.</div>}
          <button onClick={exportResult}
            disabled={loading||!aiComment||!contactSelected||(contactPref.phone&&!phoneNumber)}
            style={{ background:(loading||!aiComment||!contactSelected||(contactPref.phone&&!phoneNumber))?"#94a3b8":"#0f172a", color:"#fff",border:"none",borderRadius:8,padding:"14px 32px",fontSize:15,fontWeight:600,cursor:(loading||!aiComment||!contactSelected||(contactPref.phone&&!phoneNumber))?"not-allowed":"pointer",width:"100%" }}>
            ⬇️ Télécharger mon rapport PDF
          </button>
          {contactPref.phone&&!phoneNumber&&<p style={{ fontSize:12,color:"#94a3b8",textAlign:"center",marginTop:8 }}>Merci de saisir votre numéro de téléphone.</p>}
        </div>
      </div>
    </div>
  );
}
