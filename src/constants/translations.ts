export type Language = 'it' | 'en';

export interface Translations {
  sidebar: {
    newChat: string;
    searchPlaceholder: string;
    noResults: string;
    noChats: string;
    pinned: string;
    today: string;
    yesterday: string;
    previousWeek: string;
    older: string;
    teamTitle: string;
    teamSubtitle: string;
    viewTeam: string;
    deletePrompt: string;
    pin: string;
    unpin: string;
    rename: string;
    language: string;
  };
  header: {
    modelSelectorHint: string;
    webSearch: string;
    webSearchActive: string;
    exportHtml?: string;
    team: string;
    settings: string;
  };
  welcome: {
    title: string;
    subtitle: string;
    createdBy: string;
    currentModel: string;
    greeting: (name: string) => string;
    howCanIAssist: string;
    changeName: string;
  };
  nameModal: {
    title: string;
    subtitle: string;
    placeholder: string;
    submit: string;
    skip: string;
    changeTitle: string;
  };
  input: {
    placeholder: (modelName: string) => string;
    webGroundingOn: string;
    webGroundingOff: string;
    stop: string;
    chars: string;
    disclaimer: string;
  };
  chat: {
    you: string;
    fuglor: string;
    copied: string;
    copyResponse: string;
    groundingSources: string;
    errorTitle: string;
    retry: string;
  };
  studyCard: {
    category: string;
    title: string;
    description: string;
    open: string;
    promptText: string;
  };
  teamModal: {
    title: string;
    subtitle: string;
    vision: string;
    keyFocus: string;
    readyBadge: string;
    close: string;
  };
  settingsModal: {
    title: string;
    systemTitle: string;
    systemDesc: string;
    systemPlaceholder: string;
    save: string;
    saved: string;
    exportTitle?: string;
    exportDesc?: string;
    exportBtn?: string;
    clearTitle: string;
    clearDesc: string;
    clearBtn: string;
    confirmDelete: string;
    cancel: string;
  };
  theme: {
    light: string;
    dark: string;
    toggleToLight: string;
    toggleToDark: string;
  };
  pricing: {
    upgradeBtn: string;
    proBadge: string;
    betaBadge: string;
    modalTitle: string;
    modalSubtitle: string;
    monthly: string;
    annual: string;
    annualBadge: string;
    currentPlan: string;
    active: string;
    freePlanTitle: string;
    freePlanDesc: string;
    freePrice: string;
    freePeriod: string;
    proPlanTitle: string;
    proPlanDesc: string;
    proPriceMonthly: string;
    proPriceAnnual: string;
    proPeriod: string;
    schoolPlanTitle: string;
    schoolPlanDesc: string;
    schoolPrice: string;
    popularBadge: string;
    activatePro: string;
    proDisabledNotice: string;
    managePro: string;
    deactivatePro: string;
    contactTeam: string;
    proSuccessToast: string;
    couponLabel: string;
    couponPlaceholder: string;
    couponApplyBtn: string;
    couponSuccess: string;
    couponInvalid: string;
    couponCensoredHint: string;
    couponActiveBadge: string;
    couponActiveMsg: string;
  };
  shareModal: {
    title: string;
    subtitle: string;
    copyLink: string;
    copied: string;
    whatsapp: string;
    whatsappDesc: string;
    googleChat: string;
    googleChatDesc: string;
    otherApps: string;
    otherAppsDesc: string;
    urlLabel: string;
    shareMessage: string;
    close: string;
  };
}

export const TRANSLATIONS: Record<Language, Translations> = {
  it: {
    sidebar: {
      newChat: 'Nuova Conversazione',
      searchPlaceholder: 'Cerca conversazioni...',
      noResults: 'Nessuna conversazione trovata',
      noChats: 'Nessuna conversazione ancora.',
      pinned: 'Fissate',
      today: 'Oggi',
      yesterday: 'Ieri',
      previousWeek: 'Ultimi 7 Giorni',
      older: 'Precedenti',
      teamTitle: 'Team Fuglor AI',
      teamSubtitle: 'Architettura · UI/UX · Intelligenza',
      viewTeam: 'Vedi →',
      deletePrompt: 'Canc?',
      pin: 'Fissa in alto',
      unpin: 'Rimuovi fissaggio',
      rename: 'Rinomina',
      language: 'Lingua',
    },
    header: {
      modelSelectorHint: 'SELEZIONA MODELLO FUGLOR',
      webSearch: 'Ricerca Web',
      webSearchActive: 'Ricerca Web Attiva',
      exportHtml: 'Esporta HTML',
      team: 'Team',
      settings: 'Impostazioni e Prompt',
    },
    welcome: {
      title: 'Fuglor AI',
      subtitle: 'Intelligenza artificiale ad alta velocità per studio, codice e ricerca con fonti web.',
      createdBy: 'Creato da',
      currentModel: 'Modello attivo:',
      greeting: (name: string) => `Ciao, ${name} 👋`,
      howCanIAssist: 'Come posso aiutarti oggi nello studio o nei compiti?',
      changeName: 'Modifica nome',
    },
    nameModal: {
      title: 'Benvenuto su Fuglor AI',
      subtitle: 'Come ti chiami? Personalizzeremo la tua esperienza di studio e assistenza.',
      placeholder: 'Scrivi il tuo nome...',
      submit: 'Inizia a studiare',
      skip: 'Salta per ora',
      changeTitle: 'Modifica il tuo nome',
    },
    input: {
      placeholder: (modelName: string) =>
        `Chiedi a ${modelName} qualsiasi cosa (Invio per inviare, Shift+Invio a capo)`,
      webGroundingOn: 'Ricerca Web Google attiva',
      webGroundingOff: 'Attiva Ricerca Web Google',
      stop: 'Ferma',
      chars: 'caratteri',
      disclaimer: 'Fuglor AI utilizza il metodo socratico per aiutarti a ragionare. Creato da Federico, Luca e Gabriel.',
    },
    chat: {
      you: 'Tu',
      fuglor: 'Fuglor AI',
      copied: 'Copiato!',
      copyResponse: 'Copia',
      groundingSources: 'Fonti verificate sul Web',
      errorTitle: 'Errore di generazione',
      retry: 'Riprova',
    },
    studyCard: {
      category: 'Studio & Risorse',
      title: 'Help studying',
      description: 'Accedi rapidamente a 11 presentazioni e schemi Canva: Arte, Scienze, Divina Commedia, Geografia, Storia e Sistema Solare.',
      open: 'Apri Schede',
      promptText: 'Help studying',
    },
    teamModal: {
      title: 'Team Fuglor AI',
      subtitle: 'Il trio dietro l’architettura, il design e la visione',
      vision: 'Fuglor AI unisce la passione per l’intelligenza artificiale, il design e l’apprendimento scolastico: Gabriel ha progettato l’AI, le API e il metodo socratico; Luca e Federico hanno ideato il nome, disegnato il logo e curato lo stile visivo.',
      keyFocus: 'Contributi Principali:',
      readyBadge: 'Pronto per la scuola e lo studio',
      close: 'Chiudi',
    },
    settingsModal: {
      title: 'Impostazioni',
      systemTitle: 'Istruzioni di Sistema Globali',
      systemDesc: 'Personalizza il comportamento, il tono o il livello scolastico di Fuglor AI per tutte le chat.',
      systemPlaceholder: 'es. Rispondi in modo diretto con spiegazioni chiare per il liceo.',
      save: 'Salva Impostazioni',
      saved: 'Salvato!',
      exportTitle: 'Esportazione',
      exportDesc: 'Scarica l’applicazione in un singolo file HTML.',
      exportBtn: 'Esporta App',
      clearTitle: 'Cancella Cronologia',
      clearDesc: 'Elimina tutte le chat salvate in locale',
      clearBtn: 'Elimina Tutto',
      confirmDelete: 'Conferma',
      cancel: 'Annulla',
    },
    theme: {
      light: 'Chiaro',
      dark: 'Scuro',
      toggleToLight: 'Passa al tema chiaro',
      toggleToDark: 'Passa al tema scuro',
    },
    pricing: {
      upgradeBtn: 'Passa a Pro',
      proBadge: 'PRO',
      betaBadge: 'ANTEPRIMA',
      modalTitle: 'Sblocca il potenziale di Fuglor AI',
      modalSubtitle: 'Scegli il piano adatto alle tue esigenze di studio o sblocca l’anteprima Pro con il codice riservato.',
      monthly: 'Mensile',
      annual: 'Annuale',
      annualBadge: '-25% Annuale',
      currentPlan: 'Piano attuale',
      active: 'Attivo',
      freePlanTitle: 'Fuglor Base',
      freePlanDesc: 'Tutto il necessario per i compiti quotidiani, mappe e schede Canva.',
      freePrice: '0 €',
      freePeriod: 'per sempre',
      proPlanTitle: 'Fuglor Pro',
      proPlanDesc: 'Accesso prioritario e funzioni avanzate per sessioni intense di studio.',
      proPriceMonthly: '4,99 €',
      proPriceAnnual: '3,75 €',
      proPeriod: 'mese',
      schoolPlanTitle: 'Classe & Scuola',
      schoolPlanDesc: 'Soluzione condivisa pensata per classi, docenti e istituti.',
      schoolPrice: '19,99 €',
      popularBadge: 'PIÙ SCELTO',
      activatePro: 'Checkout Stripe in arrivo',
      proDisabledNotice: 'I pagamenti online saranno attivati presto. Puoi sbloccare l’anteprima Pro qui sotto con un codice coupon.',
      managePro: 'Gestisci Piano',
      deactivatePro: 'Disattiva e torna al Base',
      contactTeam: 'Richiesta scuole (presto)',
      proSuccessToast: 'Piano Pro attivato!',
      couponLabel: 'Codice Coupon Anteprima',
      couponPlaceholder: 'Inserisci codice...',
      couponApplyBtn: 'Attiva',
      couponSuccess: 'Codice valido! Fuglor Pro sbloccato.',
      couponInvalid: 'Codice coupon non valido.',
      couponCensoredHint: 'Codice protetto e mascherato',
      couponActiveBadge: 'Accesso Anticipato Pro',
      couponActiveMsg: 'Hai attivato tutte le funzionalità Fuglor Pro tramite coupon.',
    },
    shareModal: {
      title: 'Condividi Fuglor AI',
      subtitle: 'Fai conoscere Fuglor AI ai tuoi compagni di classe o docenti.',
      copyLink: 'Copia link',
      copied: 'Copiato!',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Invia in una chat o gruppo classe',
      googleChat: 'Google Chat',
      googleChatDesc: 'Copia il testo e apri Google Chat',
      otherApps: 'Altre app',
      otherAppsDesc: 'Condividi tramite menu di sistema',
      urlLabel: 'Link Diretto',
      shareMessage: 'Prova Fuglor AI, l’assistente didattico creato da Gabriel, Luca e Federico! https://fuglor.ai.studio/',
      close: 'Chiudi',
    },
  },
  en: {
    sidebar: {
      newChat: 'New Conversation',
      searchPlaceholder: 'Search conversations...',
      noResults: 'No matching conversations',
      noChats: 'No past conversations yet.',
      pinned: 'Pinned',
      today: 'Today',
      yesterday: 'Yesterday',
      previousWeek: 'Previous 7 Days',
      older: 'Older',
      teamTitle: 'Fuglor AI Team',
      teamSubtitle: 'Architecture · UI/UX · Intelligence',
      viewTeam: 'View →',
      deletePrompt: 'Del?',
      pin: 'Pin to top',
      unpin: 'Unpin',
      rename: 'Rename',
      language: 'Language',
    },
    header: {
      modelSelectorHint: 'SELECT FUGLOR MODEL PERSONA',
      webSearch: 'Web Search',
      webSearchActive: 'Web Search Active',
      exportHtml: 'Export HTML',
      team: 'Team',
      settings: 'Settings & System Prompt',
    },
    welcome: {
      title: 'Fuglor AI',
      subtitle: 'High-speed AI workspace for study, coding, and grounded web research.',
      createdBy: 'Created by',
      currentModel: 'Active model:',
      greeting: (name: string) => `Hi, ${name} 👋`,
      howCanIAssist: 'How can I help you study or tackle homework today?',
      changeName: 'Edit name',
    },
    nameModal: {
      title: 'Welcome to Fuglor AI',
      subtitle: 'What is your name? We will personalize your study experience.',
      placeholder: 'Enter your name...',
      submit: 'Get started',
      skip: 'Skip for now',
      changeTitle: 'Edit your name',
    },
    input: {
      placeholder: (modelName: string) =>
        `Ask ${modelName} anything (Enter to send, Shift+Enter for new line)`,
      webGroundingOn: 'Google Web Search active',
      webGroundingOff: 'Enable Google Web Search',
      stop: 'Stop',
      chars: 'chars',
      disclaimer: 'Fuglor AI uses the Socratic method to help you reason step by step. Created by Federico, Luca, and Gabriel.',
    },
    chat: {
      you: 'You',
      fuglor: 'Fuglor AI',
      copied: 'Copied!',
      copyResponse: 'Copy',
      groundingSources: 'Verified Web Sources',
      errorTitle: 'Generation Error',
      retry: 'Retry',
    },
    studyCard: {
      category: 'Study & Resources',
      title: 'Help studying',
      description: 'Quick access to 11 Canva study presentations covering Art History, Science, Divine Comedy, Geography, and History.',
      open: 'Open Decks',
      promptText: 'Help studying',
    },
    teamModal: {
      title: 'Team Fuglor AI',
      subtitle: 'The trio behind the architecture, design, and vision',
      vision: 'Fuglor AI combines AI engineering, visual craft, and guided learning: Gabriel built the AI architecture and Socratic method; Luca and Federico shaped the name, logo, and light/dark UI design.',
      keyFocus: 'Key Contributions:',
      readyBadge: 'Built for students & classrooms',
      close: 'Close',
    },
    settingsModal: {
      title: 'Settings',
      systemTitle: 'Global System Instructions',
      systemDesc: 'Customize how Fuglor AI responds across all conversations.',
      systemPlaceholder: 'e.g. Respond clearly with step-by-step high school level explanations.',
      save: 'Save Settings',
      saved: 'Saved!',
      exportTitle: 'Export',
      exportDesc: 'Download the app as a standalone HTML file.',
      exportBtn: 'Export App',
      clearTitle: 'Clear History',
      clearDesc: 'Delete all locally stored conversations',
      clearBtn: 'Delete All',
      confirmDelete: 'Confirm',
      cancel: 'Cancel',
    },
    theme: {
      light: 'Light',
      dark: 'Dark',
      toggleToLight: 'Switch to light mode',
      toggleToDark: 'Switch to dark mode',
    },
    pricing: {
      upgradeBtn: 'Upgrade to Pro',
      proBadge: 'PRO',
      betaBadge: 'PREVIEW',
      modalTitle: 'Unlock Fuglor AI Pro',
      modalSubtitle: 'Pick the plan that fits your study workflow or redeem a preview coupon below.',
      monthly: 'Monthly',
      annual: 'Annual',
      annualBadge: '-25% Annual',
      currentPlan: 'Current plan',
      active: 'Active',
      freePlanTitle: 'Fuglor Base',
      freePlanDesc: 'Everything you need for daily homework, concept maps, and Canva decks.',
      freePrice: '$0',
      freePeriod: 'forever',
      proPlanTitle: 'Fuglor Pro',
      proPlanDesc: 'Priority intelligence and advanced tools for deep study sessions.',
      proPriceMonthly: '$4.99',
      proPriceAnnual: '$3.75',
      proPeriod: 'month',
      schoolPlanTitle: 'Classroom & School',
      schoolPlanDesc: 'Shared setup built for classes, teachers, and schools.',
      schoolPrice: '$19.99',
      popularBadge: 'POPULAR',
      activatePro: 'Stripe checkout coming soon',
      proDisabledNotice: 'Online billing will launch soon. You can unlock the Pro preview below using an invite coupon.',
      managePro: 'Manage Plan',
      deactivatePro: 'Return to Base Plan',
      contactTeam: 'School inquiry (soon)',
      proSuccessToast: 'Pro Plan activated!',
      couponLabel: 'Preview Coupon Code',
      couponPlaceholder: 'Enter code...',
      couponApplyBtn: 'Redeem',
      couponSuccess: 'Valid coupon! Fuglor Pro unlocked.',
      couponInvalid: 'Invalid coupon code.',
      couponCensoredHint: 'Protected masked input',
      couponActiveBadge: 'Pro Early Access',
      couponActiveMsg: 'All Fuglor Pro features are unlocked via your preview coupon.',
    },
    shareModal: {
      title: 'Share Fuglor AI',
      subtitle: 'Invite classmates or teachers to try Fuglor AI.',
      copyLink: 'Copy link',
      copied: 'Copied!',
      whatsapp: 'WhatsApp',
      whatsappDesc: 'Send directly to a chat or class group',
      googleChat: 'Google Chat',
      googleChatDesc: 'Copy message and open Google Chat',
      otherApps: 'Other apps',
      otherAppsDesc: 'Share via device share sheet',
      urlLabel: 'Direct Link',
      shareMessage: 'Try Fuglor AI, the study assistant created by Gabriel, Luca, and Federico! https://fuglor.ai.studio/',
      close: 'Close',
    },
  },
};
