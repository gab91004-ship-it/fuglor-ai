import { FuglorModel, TeamMember } from '../types';

export const FUGLOR_MODELS: FuglorModel[] = [
  {
    id: 'fuglor-lite',
    name: 'Fuglor Lite',
    geminiModel: 'gemini-3.1-flash-lite',
    badge: 'Ultra Fast',
    description: 'Modello ad altissima velocità e disponibilità gratuita immediata, perfetto per spiegazioni, compiti e studio.',
    allowsGrounding: true,
    tagline: 'Risposte istantanee ad alta affidabilità',
  },
  {
    id: 'fuglor-speed',
    name: 'Fuglor Speed',
    geminiModel: 'gemini-3.1-flash-lite',
    badge: 'Leggero',
    description: 'Versione ultra-veloce per risposte lampo a micro-latenza.',
    allowsGrounding: true,
    tagline: 'Micro-latenza per domande veloci',
  },
  {
    id: 'fuglor-architect',
    name: 'Fuglor Tutor',
    geminiModel: 'gemini-4-hydrogen',
    badge: 'Tutor Metodo',
    description: 'Specializzato nel metodo socratico, guida passo-passo e schemi di studio per scuola e compiti.',
    allowsGrounding: false,
    tagline: 'Guida passo-passo per farti arrivare alla soluzione',
  },
  {
    id: 'fuglor-research',
    name: 'Fuglor Web Research',
    geminiModel: 'gemini-4-hydrogen',
    badge: 'Ricerca Web',
    description: 'Con ricerca web integrata per fonti aggiornate, approfondimenti e verifiche storiche e scientifiche.',
    allowsGrounding: true,
    tagline: 'Ricerca e sintesi con fonti web in tempo reale',
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Gabriel',
    role: 'Sviluppo IA & Selezione API',
    bio: 'Ha sviluppato l\'architettura dell\'Intelligenza Artificiale di Fuglor, selezionato e testato le API ad alte prestazioni, curando lo streaming delle risposte, il metodo socratico per lo studio e la precisione del modello.',
    avatarBg: 'from-emerald-500 to-teal-600',
    specialty: 'Sviluppo IA & API',
    contributions: [
      'Sviluppo e configurazione dell\'Intelligenza Artificiale Fuglor',
      'Selezione, test e integrazione delle API',
      'Ottimizzazione risposte e streaming in tempo reale',
    ],
  },
  {
    name: 'Luca',
    role: 'Ideazione Nome, Design Logo & Tema',
    bio: 'Ha ideato e scelto il nome Fuglor, progettato il logo ufficiale e definito il tema grafico chiaro/scuro e l\'identità visiva dell\'applicazione per renderla moderna e accattivante.',
    avatarBg: 'from-violet-500 to-indigo-600',
    specialty: 'Nome, Logo & UI Theme',
    contributions: [
      'Ideazione e scelta del nome Fuglor',
      'Progettazione e design grafico del logo',
      'Scelta della palette colori e stile del tema',
    ],
  },
  {
    name: 'Federico',
    role: 'Ideazione Nome, Design Logo & Tema',
    bio: 'Ha collaborato attivamente alla scelta del nome Fuglor, alla definizione grafica del logo e all\'armonizzazione del tema visivo tra modalità chiara e scura.',
    avatarBg: 'from-cyan-500 to-blue-600',
    specialty: 'Nome, Logo & UI Theme',
    contributions: [
      'Scelta e definizione del nome Fuglor',
      'Collaborazione al design del logo',
      'Progettazione del tema chiaro e scuro',
    ],
  },
];

export interface StarterPrompt {
  category: string;
  title: string;
  description: string;
  prompt: string;
  iconType?: 'study' | 'sports' | 'code' | 'science';
  customResponse?: string;
}

export const STARTER_PROMPTS: StarterPrompt[] = [
  {
    category: 'Studio & Risorse',
    title: 'Help studying',
    description: 'Accedi rapidamente a 11 presentazioni e schemi Canva: Arte, Scienze, Divina Commedia, Geografia, Storia e Sistema Solare.',
    prompt: 'Help studying',
    iconType: 'study',
    customResponse: `Ecco le risorse e le presentazioni di studio disponibili su Canva:

### 📚 Presentazioni e Schemi per lo Studio (Canva)

1. **🏛️ Storia dell’arte — Storia dell’arte egizia**  
   [Apri presentazione Canva: Storia dell’arte egizia](https://canva.link/0z8s32plgcfa9va)

2. **🧪 Scienze — Il rame**  
   [Apri presentazione Canva: Scienze — Il rame](https://canva.link/lr0o104o7gl1il8)

3. **🏺 Storia — Le popolazioni precolombiane**  
   [Apri presentazione Canva: Storia — Le popolazioni precolombiane](https://canva.link/8vge6eqzxvtmx71)

4. **🌍 Geografia — L’Unione Europea**  
   [Apri presentazione Canva: Geografia — L’Unione Europea](https://canva.link/wun5mnzlk26ilsp)

5. **📖 Letteratura — Introduzione della Divina Commedia**  
   [Apri presentazione Canva: Letteratura — Introduzione della Divina Commedia](https://canva.link/89mxxwp517ghav5)

6. **🗺️ Geografia — Viterbo e provincia**  
   [Apri presentazione Canva: Geografia — Viterbo e provincia](https://canva.link/k52rz377mstfogj)

7. **🎨 Storia dell’arte — Yayoi Kusama (video lezione)**  
   [Apri presentazione Canva: Storia dell’arte — Yayoi Kusama video lezione](https://canva.link/emxp4ouoe30xwip)

8. **🏛️ Storia dell’arte — L’anfiteatro**  
   [Apri presentazione Canva: Storia dell’arte — L’anfiteatro](https://canva.link/yht9x9i9jr7i4kp)

9. **🪐 Scienze — Il sistema solare**  
   [Apri presentazione Canva: Scienze — Il sistema solare](https://canva.link/2wznzjsttqe1cfw)

10. **🦕 Cultura generale — Mostro di Loch Ness**  
    [Apri presentazione Canva: Cultura generale — Mostro di Loch Ness](https://canva.link/jpwcq7jfhzdfmam)

11. **⛪ Storia — La riforma della Chiesa**  
    [Apri presentazione Canva: Storia — La riforma della Chiesa](https://canva.link/xusmyto06cqizc8)

---
*Come posso aiutarti a studiare? Puoi chiedermi riassunti dei concetti chiave, schemi temporali, definizioni scientifiche, domande di verifica o un quiz di ripasso su ciascuno di questi argomenti!*`,
  },
];

