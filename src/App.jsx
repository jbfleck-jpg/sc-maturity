import { useState, useEffect } from "react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Cell, Tooltip, ReferenceLine
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ── Protections anti-copie ───────────────────────────────────────────────────
const useAntiCopy = () => {
  useEffect(() => {
    // Désactiver la sélection de texte
    const style = document.createElement("style");
    style.innerHTML = `
      * {
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
        user-select: none !important;
      }
      input, textarea {
        -webkit-user-select: text !important;
        -moz-user-select: text !important;
        -ms-user-select: text !important;
        user-select: text !important;
      }
    `;
    document.head.appendChild(style);

    // Bloquer le clic droit
    const onContextMenu = (e) => e.preventDefault();
    document.addEventListener("contextmenu", onContextMenu);

    // Bloquer les raccourcis clavier de copie/impression
    const onKeyDown = (e) => {
      const blocked = (
        (e.ctrlKey || e.metaKey) && ["c","C","a","A","p","P","s","S","u","U"].includes(e.key)
      ) || e.key === "F12" || (e.ctrlKey && e.shiftKey && ["i","I","j","J","c","C"].includes(e.key));
      if (blocked) e.preventDefault();
    };
    document.addEventListener("keydown", onKeyDown);

    // Bloquer le drag & drop (empêche de glisser du texte)
    const onDragStart = (e) => e.preventDefault();
    document.addEventListener("dragstart", onDragStart);

    return () => {
      document.head.removeChild(style);
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("dragstart", onDragStart);
    };
  }, []);
};

const WEBHOOK_SHEETS     = "https://hook.eu1.make.com/mvkyqewrwl5dqkpas3q7n6dkaujrlyjr";
const WEBHOOK_SEND_CODE  = "https://hook.eu1.make.com/kco13vkgdxkbiyt56htec2nxfs4ah72p";
const WEBHOOK_CHECK_CODE = "https://hook.eu1.make.com/8rfm5s2uyj7x9frfh33bbvmflejqps8m";
const WEBHOOK_NOTIFY     = "https://hook.eu1.make.com/osffevk5713ddnavxlj4yqbgm4346hh9";
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
  const lines = text.split("\n");
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
    const paras = text.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    return {
      maturityLevel: paras[0] || "",
      strengths: paras[1] || "",
      improvements: paras[2] || "",
      recommendations: paras[3] || "",
      nextSteps: paras[4] || "",
    };
  }
  const result = { maturityLevel:"", strengths:"", improvements:"", recommendations:"", nextSteps:"" };
  sectionStarts.forEach(({ key, idx }, i) => {
    const endIdx = i + 1 < sectionStarts.length ? sectionStarts[i+1].idx : lines.length;
    const sectionLines = lines.slice(idx + 1, endIdx).join("\n").trim();
    result[key] = sectionLines;
  });
  return result;
};

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
  { level:1, label:"Réactive",    color:"#ea580c", desc:"Processus documentés par fonction, mais cloisonnés.", detail:"Les processus commencent à être formalisés par fonction (appro, production, logistique, adv) par nécessité. La documentation existe mais reste cloisonnée. Des KPIs locaux peuvent être suivis et exister sans analyse globale et régulière.", keywords:"Processus documentés · Silos persistants · KPIs locaux · Réactivité" },
  { level:2, label:"Maîtrisée",  color:"#d97706", desc:"Processus alignés sur la stratégie globale, début de collaboration.", detail:"Tous les processus sont formalisés et alignés sur une stratégie globale. L'entreprise cherche à stabiliser ses opérations. Un responsable SC est nommé. Les silos commencent à s'atténuer.", keywords:"Processus alignés · KPIs transverses · Stabilisation · Outils centralisés" },
  { level:3, label:"Intégrée",   color:"#65a30d", desc:"Vision globale, S&OP déployé, collaboration systématique.", detail:"Toutes les fonctions SC travaillent ensemble. Un S&OP synchronise l'offre et la demande. La collaboration est systématique en interne et avec les partenaires. Les outils ERP/WMS/TMS sont intégrés.", keywords:"Collaboration systématique · S&OP · Vision globale · Intégration des outils" },
  { level:4, label:"Améliorée",  color:"#16a34a", desc:"Amélioration continue, décisions basées sur les faits, centre d'excellence.", detail:"L'entreprise intègre l'amélioration continue dans sa culture SC. Les processus sont améliorés progressivement via les techniques de résolution de problème. Les décisions sont prises sur la base de faits, donc de données. Un service \"méthode logistique\" capitalise les bonnes pratiques et mène des projets d'amélioration.", keywords:"Amélioration continue · Lean/Six Sigma · Centre d'excellence" },
  { level:5, label:"Optimisée",  color:"#0d9488", desc:"Centre de profit différenciant, IA/IoT, visibilité end-to-end.", detail:"La SC est perçue comme un centre de profit différenciant. Les technologies avancées (IA, IoT, blockchain) sont intégrées. Les processus sont auto-optimisés. Les services logistiques sont monétisés.", keywords:"Centre de profit · IA/IoT/Blockchain · Visibilité end-to-end · Monétisation" },
];

// FIX 1: getLevel utilise Math.floor — ne pas modifier
const getLevel = (s) => MATURITY_LEVELS.find(l => l.level === Math.min(Math.floor(s), 5)) || MATURITY_LEVELS[0];


// ── NutriScore Supply Chain ───────────────────────────────────────────────────
const NutriScore = ({ avgScore }) => {
  const levels = MATURITY_LEVELS;
  const currentLevel = Math.floor(avgScore);
  // Option D : tablettes égales, active légèrement plus haute avec label
  // Padding 20% = 1/5 de la dimension pour laisser de l'air autour du chiffre
  const baseW = 52; const baseH = 44;
  const activeH = 60;
  const pad = baseW * 0.20; // 20% padding
  return (
    <div style={{ display:"flex", alignItems:"flex-end", justifyContent:"center", gap:5, margin:"16px 0" }}>
      {levels.map((l) => {
        const isActive = l.level === currentLevel;
        // Taille de police = hauteur disponible après padding * 0.55
        const innerH = (isActive ? activeH : baseH) - pad * 2;
        const fontSize = isActive ? Math.floor(innerH * 0.55) : Math.floor(innerH * 0.55);
        return (
          <div key={l.level} style={{
            width: baseW,
            height: isActive ? activeH : baseH,
            background: l.color,
            borderRadius: isActive ? 10 : 8,
            display:"flex", flexDirection:"column",
            alignItems:"center", justifyContent:"center",
            padding: `${pad}px`,
            boxShadow: isActive ? `0 4px 16px ${l.color}88` : "none",
            transition:"all 0.3s",
            opacity: isActive ? 1 : 0.35,
          }}>
            <span style={{
              color:"#fff", fontWeight:900,
              fontSize: fontSize,
              lineHeight:1,
            }}>{l.level}</span>
            {isActive && (
              <span style={{ color:"#fff", fontSize:9, fontWeight:700, marginTop:4, opacity:0.95, letterSpacing:0.3, textAlign:"center" }}>
                {l.label}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
};

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
  themeScores.forEach((_, i) => {
    const a = i * step - Math.PI / 2;
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    doc.line(cx, cy, cx+radius*Math.cos(a), cy+radius*Math.sin(a));
  });
  const pts = themeScores.map((d, i) => {
    const a = i * step - Math.PI / 2;
    return [cx+(radius*d.score/5)*Math.cos(a), cy+(radius*d.score/5)*Math.sin(a)];
  });
  doc.setDrawColor(12,47,114); doc.setLineWidth(0.75);
  for (let i=0; i<pts.length; i++) doc.line(pts[i][0], pts[i][1], pts[(i+1)%pts.length][0], pts[(i+1)%pts.length][1]);
  pts.forEach(([x,y], i) => {
    doc.setFillColor(12,47,114); doc.circle(x, y, 1.2, "F");
    doc.setFontSize(6.5); doc.setFont("helvetica","bold"); doc.setTextColor(12,47,114);
    doc.text(`${themeScores[i].score}`, x+2, y-2);
  });

  doc.setFontSize(8); doc.setFont("helvetica","bold");
  doc.setTextColor(lvlColor[0], lvlColor[1], lvlColor[2]);
  doc.text(`Moy. ${avgScore}/5`, cx, cy+3, { align:"center" });
  doc.setFont("helvetica","normal");

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
    lines.forEach((line,li) => doc.text(noPDF(line), lx, sy+li*lh, { align }));
  });
  doc.setFont("helvetica","normal");
};

// Normalise les accents pour jsPDF (Helvetica standard ne supporte pas UTF-8 étendu)
const noPDF = (s) => (s || "")
  .replace(/[àâä]/g,"a").replace(/[éèêë]/g,"e").replace(/[îï]/g,"i")
  .replace(/[ôö]/g,"o").replace(/[ùûü]/g,"u").replace(/[ÀÂÄ]/g,"A")
  .replace(/[ÉÈÊË]/g,"E").replace(/[ÎÏ]/g,"I").replace(/[ÔÖ]/g,"O")
  .replace(/[ÙÛÜ]/g,"U").replace(/[ç]/g,"c").replace(/[Ç]/g,"C")
  .replace(/[æ]/g,"ae").replace(/[œ]/g,"oe").replace(/[ñ]/g,"n")
  .replace(/['’‘]/g,"'").replace(/[–—]/g,"-").replace(/[«»]/g,'"');

const drawBarChartPDF = (doc, startX, startY, chartW, barData, avgScore) => {
  const barH = 9; const gap = 5;
  const labelW = 52;  // thématique plus courte
  const scoreW = 18;  // score plus large
  const barAreaW = chartW - labelW - scoreW - 8;
  const totalH = barData.length * (barH + gap);

  // Ligne de moyenne verticale
  const avgX = startX + labelW + (barAreaW * avgScore / 5);
  doc.setDrawColor(220,38,38); doc.setLineWidth(0.8);
  doc.setLineDashPattern([2,2], 0);
  doc.line(avgX, startY-14, avgX, startY+totalH);
  doc.setLineDashPattern([], 0);

  // Label "Moy." à droite du trait, toujours dans les limites
  const maxLabelRight = startX + chartW - 2;
  const safeLabel = Math.min(avgX + 2, maxLabelRight - 16);
  doc.setFontSize(7); doc.setTextColor(220,38,38); doc.setFont("helvetica","bold");
  doc.text(`Moy. ${avgScore}`, safeLabel, startY-16, { align:"left" });
  doc.setFont("helvetica","normal");

  barData.forEach((item, i) => {
    const y = startY + i*(barH+gap);
    // Barre strictement limitée à barAreaW
    const bw = Math.max(2, Math.min((barAreaW * item.score) / 5, barAreaW));
    const rgb = hexToRgb(getLevel(item.score).color);
    doc.setFontSize(9); doc.setTextColor(40,40,40); doc.setFont("helvetica","normal");
    // Label thématique tronqué si nécessaire
    const words = item.theme.split(" ");
    const lines = []; let curr = "";
    words.forEach(w => {
      if ((curr+" "+w).trim().length > 15) { if (curr) lines.push(curr); curr = w; }
      else curr = (curr+" "+w).trim();
    });
    if (curr) lines.push(curr);
    if (lines.length === 1) doc.text(noPDF(lines[0]), startX, y+barH-1);
    else { doc.text(noPDF(lines[0]), startX, y+3); doc.text(noPDF(lines[1]||""), startX, y+barH); }
    doc.setFillColor(...rgb);
    doc.roundedRect(startX+labelW, y, bw, barH, 1.5, 1.5, "F");
    // Score toujours dans les limites de la zone
    const scoreX = Math.min(startX+labelW+bw+3, startX+labelW+barAreaW+2);
    doc.setFontSize(9); doc.setFont("helvetica","bold"); doc.setTextColor(30,30,30);
    doc.text(`${item.score}`, scoreX, y+barH-1);
    doc.setFont("helvetica","normal");
  });

  const legendY = startY + totalH + 8;
  let lx = startX;
  MATURITY_LEVELS.forEach(l => {
    const rgb = hexToRgb(l.color);
    doc.setFillColor(...rgb); doc.rect(lx, legendY, 4, 4, "F");
    doc.setFontSize(8); doc.setTextColor(60,60,60);
    doc.text(`${l.level} - ${l.label}`, lx+5.5, legendY+3.5);
    lx += 34;
    if (lx > startX+chartW-10) lx = startX;
  });
};

// ── Main component ───────────────────────────────────────────────────────────
export default function App() {
  useAntiCopy();
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

  // ── Logique de détection de profil ─────────────────────────────────────
  const detectProfile = () => {
    const scores = THEMES.map(t => themeScore(t));
    const avg = avgScore;
    const n = scores.length;
    const stdDev = Math.sqrt(scores.map(s => (s - avg) ** 2).reduce((a, b) => a + b, 0) / n);
    const maxS = Math.max(...scores);
    const minS = Math.min(...scores);

    // Scores par thématique nommée
    const sc   = (t) => themeScore(t);
    const strategie    = sc("Stratégie Supply Chain");
    const processus    = sc("Processus & Organisation");
    const appro        = sc("Approvisionnement & Achats");
    const serviceClient= sc("Service Client");
    const stocks       = sc("Gestion des stocks");
    const flux         = sc("Flux internes");
    const logistique   = sc("Logistique");
    const transport    = sc("Transport");
    const si           = sc("Système d'Information");

    // Profil 1 — Fragile
    if (avg <= 1.5 && scores.every(s => s <= 2))
      return "fragile";
    // Profil 3 — Fort potentiel (bon partout)
    if (avg >= 3 && scores.every(s => s >= 2.5))
      return "mature";
    // Profil 5 — 1 excellent, 1 très en retrait
    if (maxS >= 4 && minS <= 1)
      return "champion";
    // Profil 6 — Fort amont, faible aval
    if ((appro + stocks) / 2 >= 3.5 && (logistique + transport + serviceClient) / 3 <= 2)
      return "fort_amont";
    // Profil 7 — Fort aval, faible amont
    if ((serviceClient + transport) / 2 >= 3.5 && (appro + stocks) / 2 <= 1.5)
      return "fort_aval";
    // Profil 8 — Vision stratégique sans relais opérationnels
    if ((si + processus) / 2 <= 1.5 && avg >= 1.5 && avg <= 3)
      return "invisible";
    // Profil 9 — Dans l'anticipation, manque de structure opérationnelle
    if (strategie >= 3.5 && (flux + logistique + transport) / 3 <= 2)
      return "strategie_sans_execution";
    // Profil 10 — Structure opérationnelle forte, manque d'anticipation
    if ((flux + logistique + transport) / 3 >= 3.5 && (strategie + processus) / 2 <= 1.5)
      return "execution_sans_strategie";
    // Profil 11 — Centrée fondamentaux, manque de transversalité
    if (si >= 3.5 && (processus + stocks + flux) / 3 <= 2)
      return "techno_sans_methode";
    // Profil 4 — Paradoxal (fort écart-type)
    if (stdDev >= 1.2)
      return "paradoxal";
    // Profil 12 — En transition
    const between2and3 = scores.filter(s => s >= 2 && s <= 3).length;
    const below2 = scores.filter(s => s < 2).length;
    if (between2and3 >= 3 && below2 >= 1 && maxS <= 3.5)
      return "transition";
    // Profil 2 — En construction (défaut bas/moyen)
    if (avg <= 2.5)
      return "construction";
    // Profil 3 par défaut si avg > 2.5
    return "mature";
  };

  // ── Textes préformatés des 12 profils ───────────────────────────────────
  const PROFILS = {
    fragile: {
      maturityLevel: `Votre supply chain opère principalement en mode réactif, au niveau 0 à 1 sur l'échelle de maturité.
Les processus ne sont pas formalisés et les décisions se prennent au cas par cas.
Les silos entre fonctions sont très marqués.
Cette situation recèle un fort potentiel de gains rapides dès lors que les premières actions structurantes sont engagées.`,
      strengths: `Malgré des scores globalement faibles, votre organisation a su maintenir une activité opérationnelle.
La capacité à gérer les urgences et à s'adapter témoigne d'une résilience humaine réelle.
Ce capital humain est une base solide sur laquelle construire.`,
      improvements: `L'ensemble des thématiques nécessite une attention immédiate.
La priorité absolue est de formaliser les processus clés et de nommer des responsables identifiés sur chaque fonction.
Mettre en place des indicateurs de base est indispensable.
Sans ce socle minimal, toute amélioration restera fragile et non pérenne.`,
      recommendations: `Ne cherchez pas à tout améliorer simultanément.
Concentrez vos efforts sur 2 ou 3 chantiers prioritaires à fort impact : la gestion des stocks, le service client et l'organisation.
Ces trois leviers conditionnent la stabilité de l'ensemble.
Un accompagnement expert est vivement recommandé pour séquencer les actions et éviter de disperser les ressources.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Visez le prochain niveau de maturité en améliorant en priorité les processus les plus vulnérables.
Un audit-diagnostic complet avec plus de 150 points de contrôle est la première étape indispensable.
Il identifiera les causes profondes de non-performance, contextualisées à votre secteur, votre taille et votre stratégie.
Les audits Aravis Performance incluent un diagnostic des causes de non-performance et un rapport complet de plus de 20 pages.
Vous obtiendrez une feuille de route priorisée avec des gains chiffrés et un calendrier réaliste.
Contactez Aravis Performance pour engager cette transformation de façon structurée.`
    },
    construction: {
      maturityLevel: `Votre supply chain se situe entre les niveaux 1 et 2 — Réactive à Maîtrisée.
Les bases existent dans la plupart des fonctions mais restent cloisonnées et peu mesurées.
Vous êtes dans une phase de transition où les efforts engagés n'ont pas encore produit tous leurs effets.`,
      strengths: `L'homogénéité des scores traduit une organisation équilibrée, sans point de rupture critique.
Les bases existent sur l'ensemble du périmètre supply chain.
Cela facilite une montée en maturité progressive et cohérente.`,
      improvements: `L'enjeu principal est de passer d'une logistique subie à une supply chain pilotée.
Les efforts doivent porter sur la transversalité entre fonctions et le pilotage par les indicateurs.
La gestion des stocks et le système d'information sont souvent les leviers les plus rentables à ce stade.`,
      recommendations: `Évitez la tentation de vouloir atteindre l'excellence partout d'un coup.
Choisissez 2 ou 3 thématiques sur lesquelles concentrer vos investissements et progressez par paliers.
La mise en place d'un S&OP simplifié et d'indicateurs partagés peut produire des résultats visibles en moins de 6 mois.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Visez le prochain niveau de maturité en améliorant en priorité les processus les plus vulnérables.
Progressez par paliers : une fois le niveau actuel consolidé, visez le niveau suivant.
Ces démarches nécessitent des investissements humains, financiers et les expertises adaptées.
Aravis Performance propose des audits ciblés sur des fonctions spécifiques avec une cinquantaine de points de contrôle.
Les audits Aravis Performance incluent un diagnostic des causes de non-performance contextualisé à votre situation et un rapport de plus de 20 pages.
Contactez Aravis Performance pour définir le périmètre d'audit le plus pertinent.`
    },
    mature: {
      maturityLevel: `Votre supply chain affiche un niveau de maturité solide, entre les niveaux 2 et 3 — Maîtrisée à Intégrée.
Les processus sont structurés, les responsabilités clairement définies et les outils en place.
Vous avez franchi le cap de la structuration et êtes en mesure de piloter votre performance de façon régulière.
Votre supply chain a un fort potentiel pour performer au niveau supérieur.`,
      strengths: `La cohérence entre toutes les thématiques est un atout majeur.
Votre supply chain fonctionne comme un système intégré, sans maillon faible critique.
La collaboration interne est effective et les décisions s'appuient sur des données fiables.`,
      improvements: `L'enjeu est de passer de la performance opérationnelle à l'excellence et à la différenciation.
Les axes prioritaires sont la digitalisation avancée et la collaboration étendue aux partenaires clés.
L'intégration de méthodes prédictives constitue le levier suivant.`,
      recommendations: `Investissez dans les technologies avancées (IA, automatisation, EDI étendu) et dans la formation de vos équipes.
Les méthodes d'excellence Lean, DDMRP et S&OP avancé sont les étapes naturelles à ce niveau.
La création d'un service méthodes logistiques est une évolution pertinente.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Visez le prochain niveau de maturité en améliorant les processus les plus vulnérables identifiés dans ce rapport.
Un audit d'excellence permettra d'identifier les derniers leviers pour viser le niveau optimisé.
Aravis Performance peut vous accompagner avec un diagnostic approfondi de vos pratiques avancées.
Les audits incluent un rapport complet de plus de 20 pages et une feuille de route priorisée avec des gains chiffrés.
Contactez Aravis Performance pour un audit ciblé sur vos fonctions à plus fort potentiel de progression.`
    },
    paradoxal: {
      maturityLevel: `Votre supply chain présente un profil atypique avec de fortes disparités entre thématiques.
Certaines fonctions atteignent un niveau de maturité élevé, tandis que d'autres restent très en retrait.
Ce déséquilibre génère des tensions opérationnelles et limite l'effet levier de vos points forts.`,
      strengths: `Vos fonctions les mieux notées témoignent d'une vraie capacité organisationnelle.
Ces îlots d'excellence prouvent que votre entreprise sait se structurer quand elle s'en donne les moyens.
Ils constituent un modèle interne à diffuser vers les autres fonctions.`,
      improvements: `Les thématiques en retrait créent des ruptures dans la chaîne de valeur.
Elles limitent en partie les bénéfices de vos points forts.
L'enjeu est d'atteindre un niveau homogène minimum sur l'ensemble du périmètre.`,
      recommendations: `Analysez pourquoi certaines fonctions ont réussi à se structurer et d'autres non.
Transférez les bonnes pratiques des fonctions fortes vers les fonctions en retrait.
Évitez de sur-investir dans vos points forts tant que les maillons critiques ne sont pas stabilisés.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Visez le prochain niveau de maturité en améliorant en priorité les processus les plus en retrait.
Aravis Performance propose des audits ciblés sur des fonctions spécifiques avec une cinquantaine de points de contrôle.
Les audits incluent une analyse contextuelle tenant compte de votre organisation globale.
Vous obtiendrez un rapport de plus de 20 pages et une feuille de route cohérente avec vos points forts existants.
Contactez Aravis Performance pour cadrer ensemble le périmètre d'intervention.`
    },
    champion: {
      maturityLevel: `Votre supply chain révèle un point d'excellence et un point de fragilité marqués.
Vous avez développé une maîtrise remarquable sur au moins une fonction.
Mais celle-ci coexiste avec une thématique très en retrait qui fragilise l'ensemble.
Ce profil reflète souvent une organisation qui a concentré ses efforts sur un domaine au détriment d'un autre.`,
      strengths: `Votre fonction la mieux notée constitue un véritable actif opérationnel.
Les pratiques, les outils et les compétences développés sur ce domaine sont une ressource précieuse.
Ils sont à capitaliser et à étendre progressivement à d'autres fonctions.`,
      improvements: `Votre thématique la plus en retrait représente un risque pour la performance globale.
Elle peut générer des ruptures et des coûts cachés qui limitent les bénéfices de votre excellence.
Ce maillon doit être traité en priorité avant tout nouvel investissement sur vos points forts.`,
      recommendations: `Définissez un plan d'action spécifique sur votre thématique en retrait avec des objectifs à 3, 6 et 12 mois.
Mobilisez les compétences de votre fonction forte pour accélérer la montée en niveau.
Ne laissez pas ce déséquilibre s'installer durablement.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit ciblé sur votre thématique la plus en retrait est indispensable.
Aravis Performance propose des audits focalisés sur des fonctions spécifiques avec une cinquantaine de points de contrôle.
Les audits incluent un diagnostic précis des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez un plan d'actions opérationnel et une feuille de route priorisée avec des gains chiffrés.
Contactez Aravis Performance pour cadrer ensemble le périmètre d'intervention le plus pertinent.`
    },
    fort_amont: {
      maturityLevel: `Votre supply chain maîtrise bien la partie amont — approvisionnements structurés, stocks pilotés.
Mais elle peine à distribuer correctement et à servir ses clients.
Ce déséquilibre est typique des entreprises orientées production qui ont négligé la distribution et la relation client.`,
      strengths: `Vos processus d'approvisionnement et de gestion des stocks sont une base solide.
La maîtrise des flux entrants vous donne une fiabilité en production que beaucoup d'entreprises n'ont pas.
Ce socle est précieux pour construire une supply chain complète et cohérente.`,
      improvements: `Logistique, transport et service client doivent être structurés avec la même rigueur que vos achats.
Un client mal livré ou mal informé ne perçoit pas vos excellentes pratiques d'approvisionnement.
Ces trois fonctions aval représentent votre priorité d'investissement.`,
      recommendations: `Investissez en priorité dans la structuration de votre service client (ADV intégrée, indicateurs de taux de service).
Professionnalisez votre transport : contrats, suivi des litiges, TMS simplifié.
L'objectif est d'aligner le niveau de vos fonctions aval sur celui de vos fonctions amont.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit ciblé sur vos fonctions logistique, transport et service client identifiera les leviers les plus efficaces.
Aravis Performance propose des audits contextualisés à votre secteur et à votre stratégie de distribution.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez un plan d'actions priorisé avec des gains chiffrés et un calendrier réaliste.
Contactez Aravis Performance pour définir le périmètre d'intervention adapté.`
    },
    fort_aval: {
      maturityLevel: `Votre organisation excelle dans la relation client et la livraison.
Mais elle souffre de fragilités structurelles côté approvisionnement et stocks.
Vous tenez vos promesses clients... jusqu'au jour où une rupture fournisseur vient tout compromettre.
La pression commerciale masque un risque opérationnel réel.`,
      strengths: `Votre culture du service client et votre maîtrise de la distribution sont des atouts différenciants.
Vos équipes ont développé des réflexes de qualité qui constituent une vraie valeur pour vos clients.
Cette excellence aval est un avantage concurrentiel à préserver.`,
      improvements: `L'approvisionnement et la gestion des stocks sont vos zones de fragilité.
Sans politique de stocks formalisée, vous êtes exposés à des ruptures imprévisibles.
Ces ruptures peuvent rapidement dégrader la satisfaction client que vous avez mis du temps à construire.`,
      recommendations: `Formalisez une politique de stocks avec des paramètres calculés (stock de sécurité, point de commande).
Structurez votre panel fournisseurs avec des contrats et des évaluations régulières.
L'objectif est de donner à votre excellence client une base d'approvisionnement fiable et prévisible.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit ciblé sur vos fonctions approvisionnement et gestion des stocks est la priorité.
Aravis Performance peut identifier les causes de vos fragilités amont et proposer un plan d'actions adapté.
Les audits incluent un diagnostic contextualisé à votre modèle commercial et un rapport de plus de 20 pages.
Vous obtiendrez une feuille de route priorisée avec des gains chiffrés et un calendrier réaliste.
Contactez Aravis Performance pour en savoir plus.`
    },
    invisible: {
      maturityLevel: `Votre supply chain dispose d'une vision stratégique mais manque de relais opérationnels.
Les processus ne sont pas suffisamment documentés et les décisions se prennent sans données fiables.
Cette absence de visibilité opérationnelle freine la mise en œuvre de toute ambition stratégique.`,
      strengths: `Malgré l'absence de formalisation, vos opérations fonctionnent.
Cela témoigne de la compétence et de l'engagement de vos équipes.
Ce capital humain est précieux et sera un moteur puissant une fois les processus et outils en place.`,
      improvements: `La priorité absolue est de mettre en place un minimum de visibilité opérationnelle.
Documenter les processus clés et définir des indicateurs de base sont les premières actions.
Améliorer l'utilisation de votre ERP existant est souvent le levier le plus rapide.`,
      recommendations: `Commencez par les 3 ou 4 processus les plus critiques et définissez 5 KPIs essentiels à suivre mensuellement.
Ces premières actions, simples et rapides, produiront des résultats visibles en quelques semaines.
On ne peut pas piloter ce qu'on ne mesure pas.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit sur vos processus et votre SI cartographiera les flux et identifiera les ressaisies inutiles.
Aravis Performance accompagne les PME industrielles dans la structuration de leur pilotage supply chain.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez un plan de mise en visibilité progressive adapté à vos contraintes de taille et de budget.
Contactez Aravis Performance pour engager cette démarche.`
    },
    strategie_sans_execution: {
      maturityLevel: `Votre supply chain a une vraie capacité d'anticipation et une vision stratégique claire.
Mais le terrain ne suit pas : les ambitions ne se traduisent pas dans les opérations quotidiennes.
Il existe un écart entre la vision et la réalité opérationnelle, source de frustration pour les équipes.`,
      strengths: `Avoir une vision stratégique et une capacité d'anticipation est un atout rare.
La direction comprend les enjeux de la supply chain et est prête à investir.
C'est un prérequis essentiel que beaucoup d'entreprises n'ont pas encore développé.`,
      improvements: `Les fonctions opérationnelles — flux internes, logistique et transport — doivent être structurées.
Elles doivent devenir les courroies de transmission de la stratégie.
Sans structure opérationnelle solide, la meilleure vision reste lettre morte.`,
      recommendations: `Identifiez les causes du décalage entre anticipation et exécution : ressources, responsables, outils ?
Définissez des objectifs opérationnels déclinés de la stratégie avec des jalons trimestriels mesurables.
Investissez dans la montée en compétences des équipes opérationnelles.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit opérationnel sur vos fonctions flux internes, logistique et transport est la priorité.
Aravis Performance peut vous aider à construire le pont entre vision stratégique et réalité opérationnelle.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez une feuille de route priorisée adaptée à vos capacités d'investissement.
Contactez Aravis Performance pour cadrer cette intervention.`
    },
    execution_sans_strategie: {
      maturityLevel: `Vos opérations quotidiennes sont solides grâce à des équipes compétentes et engagées.
Mais la supply chain manque de cap défini et de capacité d'anticipation.
Sans formalisation ni vision structurée, elle reste vulnérable aux aléas et aux départs de collaborateurs clés.`,
      strengths: `La solidité opérationnelle de vos équipes est un actif réel.
Leurs savoir-faire et leur engagement prouvent que votre organisation a les ressources pour réussir.
Ces compétences sont une base précieuse pour une transformation structurée et durable.`,
      improvements: `L'absence de stratégie formalisée et de capacité d'anticipation est un frein à la progression.
Sans formalisation, les bonnes pratiques restent dans les têtes et disparaissent avec les personnes.
La priorité est de capturer ce que vos équipes font bien pour le rendre pérenne et transmissible.`,
      recommendations: `Formalisez votre stratégie supply chain en alignement avec la stratégie de l'entreprise.
Documentez les processus maîtrisés par vos équipes avant de chercher à les améliorer.
Nommez un responsable supply chain avec un mandat clair, des objectifs définis et les moyens d'investir.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit stratégique et organisationnel formalisera vos atouts opérationnels dans une vision cohérente.
Aravis Performance accompagne les PME dans la définition de leur stratégie supply chain contextualisée.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez une feuille de route priorisée avec des gains chiffrés et un calendrier réaliste.
Contactez Aravis Performance pour construire ensemble cette feuille de route.`
    },
    techno_sans_methode: {
      maturityLevel: `Votre supply chain est centrée sur ses fondamentaux technologiques mais manque de transversalité.
Vous disposez d'outils performants (ERP, WMS, TMS) mais les processus sous-jacents restent insuffisamment structurés.
Les fonctions sont traitées en silos, sans vision d'ensemble ni fluidité des flux entre elles.`,
      strengths: `Votre investissement technologique est un actif sous-exploité.
Les outils en place ont le potentiel de transformer votre performance supply chain.
Il suffit de les adosser à des processus transverses et à une organisation cohérente.`,
      improvements: `Les processus organisationnels et la gestion des stocks doivent être structurés et alignés sur vos outils.
La transversalité entre fonctions est le levier principal pour libérer la valeur de vos investissements.
Sans cette base méthodologique, votre SI continuera à produire des données peu exploitables.`,
      recommendations: `Auditez l'utilisation réelle de votre ERP et identifiez les fonctionnalités non exploitées.
Formalisez les processus transverses en vous appuyant sur les fonctionnalités disponibles.
La rentabilité de vos outils existants peut être améliorée sans nouvel investissement technologique.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit méthodes et processus réconciliera vos outils et votre organisation.
Aravis Performance apportera un regard externe sur l'adéquation entre vos processus réels et votre SI.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez des recommandations concrètes pour maximiser le retour sur vos investissements existants.
Contactez Aravis Performance pour engager cette démarche.`
    },
    transition: {
      maturityLevel: `Votre supply chain est en cours de structuration, entre les niveaux 1 et 2-3 selon les fonctions.
Certaines ont amorcé leur transformation, tandis que d'autres restent en retrait.
Vous êtes dans une phase critique où les acquis restent fragiles et le processus est encore incomplet.`,
      strengths: `L'élan de transformation est enclenché.
Plusieurs thématiques progressent simultanément, ce qui témoigne d'une volonté organisationnelle réelle.
C'est une dynamique précieuse à entretenir et à accélérer.`,
      improvements: `Les thématiques encore en retrait fragilisent les progrès déjà réalisés.
La tentation de lancer de nouveaux chantiers avant de consolider les acquis est un piège classique.
Elle disperse les ressources et dilue les résultats obtenus.`,
      recommendations: `Finalisez la structuration des fonctions déjà engagées avant d'élargir le périmètre.
Définissez des critères clairs pour valider qu'un niveau de maturité est réellement atteint et stabilisé.
Évitez de disperser les ressources sur trop de chantiers simultanés.

Gains potentiels observés chez les PME industrielles accompagnées :
Performance de livraison : +15 à +30 %
Réduction des stocks : 25 à 40 %
Fiabilité des prévisions : +25 à +70 %
Productivité : +10 à +20 %
Capacité de production : +10 à +20 %
Réduction des coûts logistiques : 25 à 40 %`,
      nextSteps: `Un audit de transition fera le point sur ce qui est consolidé versus ce qui reste fragile.
Aravis Performance accompagne les entreprises dans ces phases de transition avec une approche pragmatique et séquencée.
Les audits incluent un diagnostic des causes de non-performance et un rapport de plus de 20 pages.
Vous obtiendrez un plan d'actions priorisé adapté à vos capacités d'investissement.
Contactez Aravis Performance pour accélérer votre transformation sur des bases solides.`
    },
  };

  const generateComment = () => {
    setLoading(true);
    const profileKey = detectProfile();
    const profil = PROFILS[profileKey] || PROFILS.construction;

    // Calcul des thèmes forts et faibles
    const sorted = THEMES.map(t => ({ t, s: themeScore(t) })).sort((a,b) => b.s - a.s);
    const top3 = sorted.slice(0, 3);
    const bottom3 = sorted.slice(-3).reverse();

    const fmtTheme = ({t, s}) => `${t} (${s}/5)`;
    const topStr = top3.map(fmtTheme).join(", ");
    const bottomStr = bottom3.map(fmtTheme).join(", ");

    // Injection des thèmes dans les sections Points forts et Points d'amélioration
    const strengthsWithThemes = `Vos thématiques les plus solides sont : ${topStr}.\n` + profil.strengths;
    const improvementsWithThemes = `Les thématiques prioritaires à renforcer sont : ${bottomStr}.\n` + profil.improvements;

    const text = [
      "VOTRE NIVEAU DE MATURITE",
      profil.maturityLevel,
      "",
      "POINTS FORTS",
      strengthsWithThemes,
      "",
      "POINTS D'AMELIORATION",
      improvementsWithThemes,
      "",
      "RECOMMANDATIONS",
      profil.recommendations,
      "",
      "PROCHAINES ETAPES",
      profil.nextSteps,
    ].join("\n");
    setAiComment(text);
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

    // ── PAGE 1 — Style Option C : Moderne & Data ────────────────────────────
    const lvlRgb = hexToRgb(level.color);

    // Header dégradé bleu foncé (42mm)
    doc.setFillColor(...blue); doc.rect(0,0,pageW,42,"F");

    // Ligne décorative colorée en bas du header
    doc.setFillColor(...lvlRgb); doc.rect(0,41,pageW,2,"F");

    // Aravis Performance + sous-titre
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("Aravis Performance", margin, 9);
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(147,197,253);
    doc.text("Rapport de maturite Supply Chain", margin, 14);

    // Badge INDICATIF
    doc.setFillColor(255,255,255,0.2); doc.roundedRect(pageW-margin-28, 5, 28, 7, 2,2,"F");
    doc.setFontSize(6); doc.setFont("helvetica","bold"); doc.setTextColor(191,219,254);
    doc.text("INDICATIF", pageW-margin-14, 10, { align:"center" });

    // Grand score à gauche
    doc.setFontSize(28); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(`${avgScore}`, margin, 32);
    doc.setFontSize(12); doc.setFont("helvetica","normal"); doc.setTextColor(147,197,253);
    doc.text(`/ 5`, margin+18, 32);

    // Niveau + identité à droite du score
    doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text(noPDF(level.label), margin+36, 28);
    doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(191,219,254);
    doc.text(noPDF(`${form.entreprise}  ·  ${form.prenom} ${form.nom}  ·  ${new Date().toLocaleDateString("fr-FR")}`), margin+36, 34);

    // Pills de synthèse (top 2 + bottom 1)
    const sortedPills = THEMES.map(t=>({t,s:themeScore(t)})).sort((a,b)=>b.s-a.s);
    const pillData = [
      { label:`+ ${noPDF(sortedPills[0].t)} ${sortedPills[0].s}/5`, color:[6,95,70] },
      { label:`+ ${noPDF(sortedPills[1].t)} ${sortedPills[1].s}/5`, color:[30,64,175] },
      { label:`! ${noPDF(sortedPills[sortedPills.length-1].t)} ${sortedPills[sortedPills.length-1].s}/5`, color:[146,64,14] },
    ];
    let pillX = margin;
    pillData.forEach(p => {
      const pw = doc.getStringUnitWidth(p.label)*6.5*0.35+8;
      doc.setFillColor(...p.color); doc.roundedRect(pillX, 37, pw, 5, 1.5,1.5,"F");
      doc.setFontSize(5.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(p.label, pillX+4, 40.5);
      pillX += pw+3;
    });

    let y = 50;

    // KPI grid : 3 blocs côte à côte
    const kpiW = (contentW-8)/3;
    const kpis = [
      { val:`${avgScore}/5`, lbl:"Score global" },
      { val:`Niv. ${Math.floor(avgScore)}`, lbl:"Maturité" },
      { val:"18", lbl:"Questions" },
    ];
    kpis.forEach((k,i) => {
      const kx = margin + i*(kpiW+4);
      doc.setFillColor(248,250,252); doc.roundedRect(kx, y, kpiW, 14, 2,2,"F");
      doc.setDrawColor(226,232,240); doc.setLineWidth(0.3);
      doc.roundedRect(kx, y, kpiW, 14, 2,2,"S");
      doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
      doc.text(noPDF(k.val), kx+kpiW/2, y+8, { align:"center" });
      doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
      doc.text(k.lbl, kx+kpiW/2, y+12.5, { align:"center" });
    });
    y += 18;

    // ── Score géant + NutriScore PDF — Option A recalculé ────────────────────
    {
      const curLevel = Math.floor(avgScore);
      const lvlColor = hexToRgb(level.color);

      // Score géant à gauche
      doc.setFontSize(32); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
      doc.text(`${avgScore}`, margin, y+12);
      doc.setFontSize(14); doc.setFont("helvetica","normal"); doc.setTextColor(203,213,225);
      doc.text("/5", margin+20, y+12);

      // Badge niveau
      doc.setFillColor(...lvlColor);
      doc.roundedRect(margin+30, y+1, 40, 10, 3, 3, "F");
      doc.setFontSize(8.5); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
      doc.text(noPDF(level.label), margin+50, y+7.5, { align:"center" });

      y += 18;

      // ── NutriScore Option A : tablettes pleine largeur, police 12pt minimum ──
      // Police cible : 12pt pour inactif, 14pt pour actif
      // Padding 20% : espace de chaque côté = 20% de la hauteur
      // Hauteur minimale pour loger 12pt + 20% padding de chaque côté :
      // h = fontSize / 0.6  → pour 12pt : h = 20mm, pour 14pt : h = 23mm
      const fontNorm = 12;   // police minimale inactive
      const fontActive = 14; // police active
      const boxHnorm   = Math.ceil(fontNorm   / 0.6);  // ~20mm
      const boxHactive = Math.ceil(fontActive  / 0.6);  // ~24mm
      const n = MATURITY_LEVELS.length;
      const gap = 2.5;
      const boxW = (contentW - gap * (n - 1)) / n;
      const baseY = y;

      MATURITY_LEVELS.forEach((l) => {
        const isActive = l.level === curLevel;
        const rgb = hexToRgb(l.color);
        const bh = isActive ? boxHactive : boxHnorm;
        const by = isActive ? baseY : baseY + (boxHactive - boxHnorm) / 2;
        const nx = margin + l.level * (boxW + gap);
        const padV = bh * 0.20; // 20% padding vertical

        if (isActive) {
          doc.setFillColor(...rgb);
        } else {
          doc.setFillColor(
            Math.round(rgb[0] * 0.30 + 255 * 0.70),
            Math.round(rgb[1] * 0.30 + 255 * 0.70),
            Math.round(rgb[2] * 0.30 + 255 * 0.70)
          );
        }
        doc.roundedRect(nx, by, boxW, bh, isActive ? 3 : 2, isActive ? 3 : 2, "F");

        // Chiffre avec 20% padding : position Y = bord haut + paddingV + ~60% de l'espace central
        const innerH = bh - padV * 2;
        const fs = isActive ? fontActive : fontNorm;
        doc.setFontSize(fs);
        doc.setFont("helvetica","bold");
        doc.setTextColor(255,255,255);
        const textY = isActive
          ? by + padV + innerH * 0.52  // centré dans la zone intérieure, laisse place au label
          : by + bh / 2 + fs * 0.30;   // parfaitement centré
        doc.text(`${l.level}`, nx + boxW / 2, textY, { align:"center" });

        if (isActive) {
          doc.setFontSize(6.5); doc.setFont("helvetica","bold");
          doc.setTextColor(255,255,255);
          doc.text(noPDF(l.label), nx + boxW / 2, by + bh - padV * 0.6, { align:"center" });
        }
      });
      y = baseY + boxHactive + 6;
    }

    doc.setFontSize(8.5); doc.setFont("helvetica","italic"); doc.setTextColor(...gray);
    doc.text("Niveau indicatif basé sur un nombre réduit d'informations, sans analyse complète du périmètre supply chain.", margin, y); y+=8;

    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Les 6 niveaux de maturité Supply Chain", margin, y); y+=5;

    MATURITY_LEVELS.forEach(l => {
      const rgb = hexToRgb(l.color);
      const isCur = Math.floor(avgScore)===l.level;

      // Calcul précis : on prépare toutes les lignes AVANT de dessiner la boîte
      doc.setFontSize(7); doc.setFont("helvetica","normal");
      const detailLines = doc.splitTextToSize(noPDF(l.detail), contentW-18).slice(0,3);
      doc.setFontSize(6); doc.setFont("helvetica","bold");
      const kwLines = doc.splitTextToSize(noPDF(l.keywords), contentW-18).slice(0,2);

      // Hauteur réelle : titre(5) + detail(4/ligne) + kw(3.5/ligne) + padding(6)
      const bH = Math.max(16, 6 + detailLines.length*4.2 + kwLines.length*3.8 + 4);

      if (y+bH>285) { doc.addPage(); y=20; }

      // Fond
      doc.setFillColor(isCur ? rgb[0] : 248, isCur ? rgb[1] : 250, isCur ? rgb[2] : 252);
      doc.roundedRect(margin, y, contentW, bH, 2,2,"F");

      // Pastille couleur
      doc.setFillColor(...rgb); doc.circle(margin+4.5, y+bH/2, 3,"F");

      // Titre niveau
      doc.setFontSize(10); doc.setFont("helvetica","bold");
      doc.setTextColor(isCur?255:30, isCur?255:30, isCur?255:30);
      doc.text(`${l.level} - ${l.label}`, margin+11, y+5.5);

      if (isCur) {
        doc.setFontSize(7); doc.setTextColor(255,255,255);
        doc.text("<-- VOTRE NIVEAU", margin+contentW-36, y+5.5);
      }

      // Texte détail
      doc.setFontSize(9); doc.setFont("helvetica","normal");
      doc.setTextColor(isCur?240:60, isCur?240:60, isCur?240:60);
      doc.text(detailLines.map(noPDF), margin+11, y+11);

      // Mots-clés
      const kwY = y + 11 + detailLines.length * 4.2;
      doc.setFontSize(8); doc.setFont("helvetica","bold");
      doc.setTextColor(isCur?220:rgb[0], isCur?220:rgb[1], isCur?220:rgb[2]);
      doc.text(kwLines.map(noPDF), margin+11, kwY);

      y += bH + 2;
    });
    y += 3;

    // ── PAGE 2 : Tableau des scores pleine largeur ──────────────────────────
    doc.addPage(); y=20;

    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 10, "F");
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Scores par thématique", margin+6, y+4); y+=10;

    // Tableau pleine largeur — aucun risque de chevauchement
    autoTable(doc, {
      startY: y, margin:{left:margin, right:margin},
      head:[["Thématique","Score","Niveau"]],
      body:THEMES.map(t=>{ const s=themeScore(t); return [t,`${s}/5`,getLevel(s).label]; }),
      styles:{fontSize:10, cellPadding:3, overflow:"linebreak"},
      headStyles:{fillColor:blue, textColor:255, fontStyle:"bold", fontSize:10},
      alternateRowStyles:{fillColor:[248,250,252]},
      columnStyles:{0:{cellWidth:100},1:{cellWidth:30,halign:"center"},2:{cellWidth:40,halign:"center"}},
      didDrawCell:(data) => {
        if (data.section==="body" && data.column.index===1) {
          const s = parseFloat(data.cell.text[0]);
          const rgb = hexToRgb(getLevel(s).color);
          doc.setFillColor(...rgb);
          doc.roundedRect(data.cell.x+2, data.cell.y+data.cell.height-3, (data.cell.width-4)*(s/5), 2, 0.5,0.5,"F");
        }
      }
    });
    y = doc.lastAutoTable.finalY + 14;

    // Radar centré sur toute la largeur
    if (y + 110 > 280) { doc.addPage(); y=20; }
    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 10, "F");
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Radar par thématique", margin+6, y+4); y+=10;

    const cx = pageW/2;
    const radarR = 44;
    const cy = y + radarR + 14;
    drawRadarPDF(doc, cx, cy, radarR, THEMES.map(t=>({theme:t,score:themeScore(t)})), avgScore);
    y = cy + radarR + 18;

    // Barchart
    if (y + THEMES.length*14 + 30 > 280) { doc.addPage(); y=20; }
    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 10, "F");
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Classement par thématique", margin+6, y+4); y+=14;
    const barData_pdf = [...THEMES.map(t=>({theme:t,score:themeScore(t)}))].sort((a,b)=>a.score-b.score);
    drawBarChartPDF(doc, margin, y, contentW, barData_pdf, avgScore);
    y += barData_pdf.length*14+28;

    // ── PAGE 3 : Detail reponses ─────────────────────────────────────────────
    doc.addPage(); y=20;
    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 8, "F");
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Détail des réponses", margin+6, y+3); y+=10;
    autoTable(doc, {
      startY:y, margin:{left:margin,right:margin},
      head:[["#","Thématique","Réponse sélectionnée","Niv."]],
      body:QUESTIONS.map((q,i)=>[`Q${i+1}`,noPDF(q.theme),noPDF(q.options[qScore(i)]),qScore(i)]),
      styles:{fontSize:9,cellPadding:3,overflow:"linebreak"},
      headStyles:{fillColor:blue,textColor:255,fontStyle:"bold"},
      alternateRowStyles:{fillColor:[248,250,252]},
      columnStyles:{0:{cellWidth:14,halign:"center"},1:{cellWidth:36},2:{cellWidth:103},3:{cellWidth:10,halign:"center"}},
    });

    // ── PAGE 4 : Analyse ────────────────────────────────────────────────────
    doc.addPage(); y=20;
    // Header section style Option C
    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 10, "F");
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Analyse personnalisée", margin+6, y+5); y+=14;

    const sectionDefs = [
      { title:"VOTRE NIVEAU DE MATURITE", color:[12,47,114],  text:aiSections?.maturityLevel||"" },
      { title:"POINTS FORTS",             color:[22,163,74],  text:aiSections?.strengths||"" },
      { title:"POINTS D'AMELIORATION",    color:[217,119,6],  text:aiSections?.improvements||"" },
      { title:"RECOMMANDATIONS",          color:[124,58,237], text:aiSections?.recommendations||"" },
      { title:"PROCHAINES ETAPES",        color:[13,148,136], text:aiSections?.nextSteps||"" },
    ];

    const sectionLabels = {
      "VOTRE NIVEAU DE MATURITE": "Votre niveau de maturité",
      "POINTS FORTS": "Points forts",
      "POINTS D'AMELIORATION":    "Points d'amélioration",
      "RECOMMANDATIONS": "Recommandations",
      "PROCHAINES ETAPES": "Prochaines étapes",
    };

    // FIX 2b: Textes IA PDF — contentW réduit + saut de page systématique + hauteur estimée avant dessin
    const textContentW = contentW - 4; // marge supplémentaire pour éviter tout débordement
    sectionDefs.forEach(({ title, color, text }) => {
      if (!text) return;
      const clean = cleanSectionText(text, title.replace(/\s+/g,"\\s+"));
      if (!clean) return;
      const displayTitle = sectionLabels[title] || title;

      // Estimer hauteur totale de la section
      const lines = doc.splitTextToSize(noPDF(clean), textContentW);
      const sectionH = 8 + lines.length * 4.5 + 7; // barre + titre + texte + marge

      // Saut de page si la section ne tient pas entièrement
      if (y + sectionH > 282) { doc.addPage(); y = 20; }

      // Barre colorée gauche
      doc.setFillColor(...color); doc.rect(margin, y, 3, 5, "F");
      doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...color);
      doc.text(displayTitle, margin+6, y+4.5); y+=8;

      // Texte — splitTextToSize avec contentW réduit
      doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(...dark);
      doc.text(lines, margin, y);
      y += lines.length * 4.5 + 7;
    });

    // ── PAGE 5 : Audit Supply Chain (même page que Prochaines étapes si possible) ──
    if (y + 80 > 280) { doc.addPage(); y = 20; } else { y += 10; }
    doc.setFillColor(...blue); doc.rect(margin, y-3, 3, 10, "F");
    doc.setFontSize(13); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
    doc.text("Audit — Diagnostic Supply Chain", margin+6, y+5); y+=14;

    const auditPhases = [
      {
        icon:"Phase terrain (1 à 5 jours par site audité)",
        items:["Collecte des elements pour identifier le niveau de maturite et comprendre le fonctionnement actuel de la Supply Chain."],
      },
      {
        icon:"Diagnostic",
        items:[
          "Évaluation complète du niveau de maturité.",
          "Recherche des causes de performance et de non-performance.",
          "Rédaction d'un rapport d'audit complet de plus de 20 pages.",
          "Construction d'une feuille de route avec 3 à 5 projets pour améliorer la maturité de l'entreprise.",
        ],
      },
      {
        icon:"Restitution (1/2 journee)",
        items:["Présentation des conclusions du rapport d'audit et échanges avec le CODIR."],
      },
    ];

    auditPhases.forEach((phase, pi) => {
      if (y+30>280) { doc.addPage(); y=20; }
      doc.setFontSize(11); doc.setFont("helvetica","bold"); doc.setTextColor(...blue);
      doc.text(phase.icon, margin, y); y+=6;
      doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(...dark);
      phase.items.forEach(item => {
        const itemLines = doc.splitTextToSize("- " + item, contentW-6);
        if (y+itemLines.length*4.5>280) { doc.addPage(); y=20; }
        doc.text(itemLines, margin+4, y);
        y += itemLines.length*4.5;
      });
      y += 6;
    });

    // ── BLOC 2 : Votre interlocuteur (fond bleu clair) ────────────────────────
    if (y + 90 > 285) { doc.addPage(); y = 20; }

    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Votre interlocuteur", margin, y); y += 6;

    // Carte identite (fond bleu clair)
    const cardH2 = 30;
    doc.setFillColor(...lightBlue);
    doc.roundedRect(margin, y, contentW, cardH2, 3, 3, "F");
    // Avatar cercle bleu
    doc.setFillColor(...blue);
    doc.circle(margin + 11, y + cardH2/2, 8, "F");
    doc.setFontSize(7); doc.setFont("helvetica","bold"); doc.setTextColor(255,255,255);
    doc.text("JBF", margin + 11, y + cardH2/2 + 2, { align:"center" });
    // Nom + titre
    doc.setFontSize(10); doc.setFont("helvetica","bold"); doc.setTextColor(...dark);
    doc.text("Jean-Baptiste FLECK", margin + 24, y + 8);
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(...gray);
    doc.text("Fondateur — Aravis Performance · Certifié QUALIOPI", margin + 24, y + 14);
    // Coordonnees dans la carte
    doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(...dark);
    doc.text("07 64 54 01 58",             margin + 24, y + 21);
    doc.text("jbfleck@aravisperformance.com", margin + 24, y + 27);
    doc.text("www.aravisperformance.com",   margin + 105, y + 21);
    doc.text("Certifié QUALIOPI",           margin + 105, y + 27);

    y += cardH2 + 8;

    // Items expertise en 2 colonnes
    const jbfItems = [
      "25 ans d'expérience en Supply Chain & Excellence Opérationnelle",
      "Plus de 20 audits-diagnostics réalisés en 5 ans",
      "Auditeur certifié France Supply Chain & Supply Chain Master",
      "Maîtrise des référentiels MMOG/LE, Supply Chain Plus, Odette et VDA",
      "Black Belt Lean 6 Sigma",
      "CPIM — Certified in Planning and Inventory Management",
    ];
    const colW = contentW / 2 - 4;
    const rowH2 = 9;
    doc.setFontSize(10); doc.setFont("helvetica","normal");
    jbfItems.forEach((item, i) => {
      const col = i % 2;
      const row = Math.floor(i / 2);
      const ix = col === 0 ? margin : margin + contentW/2 + 4;
      const iy = y + row * rowH2;
      if (iy + 6 > 283) return;
      const rgb = hexToRgb(MATURITY_LEVELS[Math.min(i, 5)].color);
      doc.setFillColor(...rgb);
      doc.circle(ix + 2, iy + 1, 1.8, "F");
      doc.setTextColor(...dark);
      const txt = doc.splitTextToSize(item, colW - 6);
      doc.text(txt[0], ix + 6, iy + 3);
    });
    y += Math.ceil(jbfItems.length / 2) * rowH2 + 4;

    const pageCount = doc.internal.getNumberOfPages();
    for (let i=1; i<=pageCount; i++) {
      doc.setPage(i);
      // Footer fond sombre style Option C
      doc.setFillColor(15,23,42); doc.rect(0,287,pageW,10,"F");
      doc.setFontSize(7.5); doc.setFont("helvetica","normal"); doc.setTextColor(100,116,139);
      doc.text("Aravis Performance  ·  jbfleck@aravisperformance.com  ·  07 64 54 01 58", margin, 293);
      doc.setTextColor(148,163,184);
      doc.text(`Page ${i} / ${pageCount}`, pageW-margin, 293, { align:"right" });
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
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}><strong>Ne prenez pas le résultat de ce questionnaire à la lettre.</strong> Un audit complet conduit par un professionnel reste nécessaire pour une analyse rigoureuse, contextualisée à votre stratégie, votre marché et votre organisation. Les référentiels du marché comptent généralement <strong>entre 150 et 200 points de contrôle</strong>.</p>
            <p style={{ color:"#1e3a6e", fontSize:14, lineHeight:1.8, margin:"12px 0 0 0" }}>À l'issue de ce questionnaire, vous disposerez d'une <strong>notation par chapitre</strong>, d'une <strong>notation globale</strong> et d'un <strong>commentaire de notre expert</strong>.</p>
          </div>
          <div style={{ background:"#f1f5f9", borderRadius:10, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#475569", display:"flex", gap:10 }}>
            <span style={{ fontSize:18 }}>📋</span>
            <span><strong>18 questions structurantes</strong> réparties sur <strong>9 thématiques</strong>. Comptez <strong>10 à 15 minutes</strong>.</span>
          </div>
          <div style={{ background:"#fff7ed", borderLeft:"4px solid #ea580c", borderRadius:"0 10px 10px 0", padding:"16px 20px", marginBottom:20 }}>
            <p style={{ color:"#9a3412", fontSize:13, lineHeight:1.9, margin:0 }}>
              ⚠️ <strong>Important :</strong> le diagnostic et la feuille de route ne sont <strong>pas compris</strong> dans cette auto-évaluation — ils nécessitent l'intervention d'un expert en situation réelle.<br/><br/>
              Par ailleurs, les auto-évaluations ont tendance à contenir des <strong>biais cognitifs</strong> qui conduisent à des résultats <strong>pessimistes ou optimistes</strong> selon le profil et la position de l'évaluateur dans l'organisation. Un auditeur professionnel a un <strong>devoir de neutralité</strong> qui garantit une analyse objective et impartiale.
            </p>
          </div>
          <button style={{...btn(true), marginBottom:28}} onClick={()=>setStep("quiz")}>Démarrer l'auto-évaluation →</button>
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
              <input type={f.type} value={form[f.key]} onChange={e=>setForm({...form,[f.key]:f.key==="email"?e.target.value.toLowerCase():e.target.value})}
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

        {/* Score global — Option A */}
        <div style={{ background:"#fff",borderRadius:16,padding:32,boxShadow:"0 4px 24px #0001",marginBottom:20,textAlign:"center" }}>
          <div style={{ fontSize:13,color:"#64748b",marginBottom:6 }}>Résultats pour <strong>{form.prenom} {form.nom}</strong> — {form.entreprise}</div>
          <h1 style={{ fontSize:22,fontWeight:700,color:"#0f172a",marginBottom:4 }}>Maturité Supply Chain</h1>
          <p style={{ fontSize:12,color:"#94a3b8",fontStyle:"italic",marginBottom:20 }}>Niveau indicatif, basé sur un nombre réduit d'informations et sans analyse du périmètre supply chain.</p>
          {/* Score géant + badge niveau */}
          <div style={{ display:"inline-flex",alignItems:"center",gap:16,marginBottom:16 }}>
            <div style={{ display:"flex",alignItems:"baseline",gap:4 }}>
              <span style={{ fontSize:42,fontWeight:900,color:C1,lineHeight:1 }}>{avgScore}</span>
              <span style={{ fontSize:22,color:"#cbd5e1",fontWeight:400 }}>/5</span>
            </div>
            <div style={{ background:level.color,color:"#fff",borderRadius:20,padding:"6px 16px",fontSize:14,fontWeight:700 }}>
              {level.label}
            </div>
          </div>
          <NutriScore avgScore={avgScore} />
          <div style={{ background:"#eff6ff",borderRadius:8,padding:"10px 16px",fontSize:13,color:C1,marginTop:16,display:"inline-flex",alignItems:"center",gap:8 }}>
            💡 <strong>Ce rapport est exportable en PDF</strong> — bouton rouge en bas de cette page.
          </div>
        </div>

        {/* Niveaux */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:18 }}>Les 6 niveaux de maturité Supply Chain</h2>
          {MATURITY_LEVELS.map(l=>(
            <div key={l.level} style={{ display:"flex",alignItems:"flex-start",gap:12,padding:"10px 14px",borderRadius:8,background:Math.floor(avgScore)===l.level?`${l.color}18`:"#f8fafc",border:`2px solid ${Math.floor(avgScore)===l.level?l.color:"transparent"}`,marginBottom:8 }}>
              <div style={{ minWidth:28,height:28,borderRadius:99,background:l.color,color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:13,flexShrink:0,marginTop:2 }}>{l.level}</div>
              <div>
                <span style={{ fontWeight:700,fontSize:13,color:"#0f172a" }}>{l.label}</span>
                {Math.floor(avgScore)===l.level&&<span style={{ fontSize:12,color:l.color,fontWeight:600,marginLeft:8 }}>← Votre niveau</span>}
                <div style={{ fontSize:12,color:"#64748b",marginTop:2 }}>{l.detail}</div>
                <div style={{ fontSize:11,color:l.color,fontWeight:600,marginTop:4 }}>{l.keywords}</div>
              </div>
            </div>
          ))}
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
          <ResponsiveContainer width="100%" height={560}>
            <RadarChart data={radarData} margin={{ top:65,right:130,bottom:65,left:130 }}>
              <PolarGrid />
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
              <Radar name="Score" dataKey="score" stroke={C1} fill={C1} fillOpacity={0.25} strokeWidth={1}
                dot={{ r:3, fill:C1 }}
                label={({ x, y, value }) => (
                  <text x={x+4} y={y-4} fontSize={10} fontWeight={700} fill={C1} textAnchor="start">{value}</text>
                )}
              />
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
              <YAxis type="category" dataKey="theme" tick={{fontSize:13,fill:"#475569"}} width={167}/>
              <Tooltip formatter={(v)=>[`${v}/5`,"Score"]}/>
              <Bar dataKey="score" radius={[0,6,6,0]}>
                {barData.map((entry,i)=><Cell key={i} fill={getLevel(entry.score).color}/>)}
              </Bar>
              <ReferenceLine x={avgScore} stroke="#dc2626" strokeDasharray="5 3" strokeWidth={2}
                label={({ viewBox }) => {
                  const { x, y } = viewBox;
                  return (
                    <text x={x + 6} y={22} fill="#dc2626" fontSize={11} fontWeight={700}>
                      {`Moy. ${avgScore}`}
                    </text>
                  );
                }}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginTop:16 }}>
            {MATURITY_LEVELS.map(l=>(
              <div key={l.level} style={{ display:"flex",alignItems:"center",gap:5,fontSize:16,color:"#475569" }}>
                <div style={{ width:12,height:12,borderRadius:3,background:l.color }}/>
                {l.level} — {l.label}
              </div>
            ))}
          </div>
        </div>

        {/* Analyse IA */}
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

        {/* Audit Supply Chain */}
        <div style={{ background:"#fff",borderRadius:16,padding:28,boxShadow:"0 4px 24px #0001",marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#0f172a",marginBottom:16 }}>L'audit - Diagnostic Supply Chain en quelques mots</h2>
          {[
            { icon:"🔍", title:"Audit : Phase terrain (1 à 5 jours par site audité)", items:["Collecte des éléments pour identifier le niveau de maturité et comprendre le fonctionnement actuel de la Supply Chain."] },
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
        {/* Contact */}
        <div style={{ background:C1,borderRadius:16,padding:28,marginBottom:20 }}>
          <h2 style={{ fontSize:15,fontWeight:600,color:"#fff",marginBottom:8 }}>Envie d'aller plus loin ?</h2>
          <p style={{ color:"#bfdbfe",fontSize:14,lineHeight:1.7,marginBottom:16 }}>Contactez Jean-Baptiste FLECK pour un audit supply chain complet ou ciblé sur une fonction prioritaire.</p>
          <a href="https://aravisperformance.com/devis" target="_blank" rel="noopener noreferrer"
            style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:10,background:"rgba(255,255,255,0.15)",color:"#fff",borderRadius:10,padding:"12px 20px",fontSize:14,fontWeight:600,textDecoration:"none",marginBottom:12,border:"1px solid rgba(255,255,255,0.3)" }}>
            💰 Évaluez le prix de votre devis en ligne, en totale autonomie →
          </a>
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
            <div style={{ borderTop:"1px solid #e2e8f0",paddingTop:12,marginTop:4 }}>
              <p style={{ fontSize:12,color:"#64748b",marginBottom:8 }}>Ou planifiez directement un créneau :</p>
              <a href="https://calendly.com/jbfleck/30min" target="_blank" rel="noopener noreferrer"
                style={{ display:"flex",alignItems:"center",justifyContent:"center",gap:8,background:C1,color:"#fff",borderRadius:8,padding:"11px 16px",fontSize:14,fontWeight:600,textDecoration:"none" }}>
                📅 Prendre rendez-vous via Calendly
              </a>
            </div>
          </div>
          {!contactSelected&&<div style={{ background:"#fef2f2",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:"#dc2626" }}>⚠️ Veuillez sélectionner une option de recontact pour télécharger votre rapport.</div>}

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
            {icon:"📋",text:"Maîtrise des référentiels MMOG/LE, Supply Chain Plus, Odette et VDA"},
            {icon:"🥋",text:"Black Belt Lean 6 Sigma"},
            {icon:"🎓",text:"CPIM — Certified in Planning and Inventory Management"},
          ].map((item,i)=>(
            <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"11px 14px",background:i%2===0?"#f8fafc":"#fff",borderRadius:8,fontSize:14,color:"#1e293b",lineHeight:1.5,marginBottom:6,border:"1px solid #e2e8f0" }}>
              <span style={{ fontSize:18,flexShrink:0 }}>{item.icon}</span><span>{item.text}</span>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
