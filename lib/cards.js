// 85 flashcard PMCSN — 13 mazzi
// Formule in LaTeX inline: $...$
export const DECKS = [
  "Leggi fondamentali, Little e relazioni di base",
  "M/M/1, M/G/1 e variabilità del servizio",
  "Multiserver M/M/m vs Single Server potenziato",
  "Catene di Markov, coda finita e perdite",
  "Scheduling Size-Based (partizione per dimensione)",
  "Priorità Abstract / Preemptive vs Non-Preemptive",
  "SRPT, FIFO, PS e slowdown",
  "Servizi Hyperexponential",
  "Leggi operazionali e Bottleneck Analysis",
  "Mean Value Analysis (MVA)",
  "Reti di Jackson (reti aperte)",
  "Markov per reti chiuse e distribuzioni stazionarie",
  "Distribuzioni, integrali e momenti ricorrenti",
];

export const CARDS = [
  // MAZZO 1
  { id: 1, deck: 0, q: "Come si calcola l'utilizzazione $\\rho$ di un M/M/1?", a: "$\\rho = \\lambda/\\mu = \\lambda \\cdot E[S]$. Valida solo se $\\lambda < \\mu$ (sistema stabile/stazionario). Se $\\lambda \\geq \\mu$ il sistema collassa." },
  { id: 2, deck: 0, q: "Legge di Little: enunciato e forme che usi più spesso.", a: "$E[N] = \\lambda \\cdot E[T]$ (numero medio nel sistema = arrivi × tempo medio). Forme derivate: $E[N_q] = \\lambda \\cdot E[T_q]$ (coda), $E[N_s] = \\lambda \\cdot E[T_s]$ (sistema). Serve per passare da un numero medio a un tempo medio e viceversa." },
  { id: 3, deck: 0, q: "Ho $E[N_q]$ e $\\lambda$, voglio $E[T_q]$. Come faccio?", a: "Inverto Little sulla coda: $E[T_q] = E[N_q]/\\lambda$. Es: $E[N_q]=0.225$, $\\lambda=0.45$ → $E[T_q]=0.5$ s." },
  { id: 4, deck: 0, q: "Relazione tra tempo di risposta e tempo di attesa.", a: "$E[T_s] = E[T_q] + E[S]$ (risposta = attesa in coda + servizio). In alternativa via Little: $E[T_s] = E[N_s]/\\lambda = (E[N_q]+\\rho)/\\lambda$." },
  { id: 5, deck: 0, q: "Quando $\\rho \\to 1$, perché non posso più usare Little per $E[T_s]$?", a: "Quando $\\rho \\to 1$ il sistema satura: $E[T_s] \\to +\\infty$ e non vale più la relazione $E[T_s] = E[N_s]/\\lambda$ in forma utile. Il sistema non è più stazionario." },
  { id: 6, deck: 0, q: "Ho $E[S]$ e voglio $\\mu$ (o viceversa).", a: "$\\mu = 1/E[S]$ ed $E[S] = 1/\\mu$. Sono inversi: $\\mu$ è un tasso (job/s), $E[S]$ è un tempo (s)." },
  { id: 7, deck: 0, q: "Per un web server: come ricavo $E[S]$ da capacità $C$ e domanda $Z$?", a: "$E[S] = Z/C$ (domanda in op/job diviso capacità in op/s = secondi/job). Poi $\\mu = 1/E[S] = C/Z$." },
  { id: 8, deck: 0, q: "Di quanto deve crescere $\\lambda$ per portare il sistema al collasso?", a: "Cerco il fattore $x$ tale che $x \\cdot \\rho = 1$, cioè $x = 1/\\rho = \\mu/\\lambda$. Es: $\\rho=0.45$ → $x=2.22$, ossia +122%. A quel punto $\\rho \\to 1$ e $E[T_s] \\to \\infty$." },

  // MAZZO 2
  { id: 9, deck: 1, q: "Formula del tempo di attesa per M/M/1 (servizio esponenziale).", a: "$E[T_q] = \\dfrac{\\rho \\cdot E[S]}{1-\\rho}$. Poi $E[T_s] = E[T_q] + E[S] = \\dfrac{E[S]}{1-\\rho}$." },
  { id: 10, deck: 1, q: "Formula di Pollaczek-Khinchine per M/G/1 (servizio generico).", a: "$E[T_q] = \\dfrac{\\rho \\cdot E[S]}{1-\\rho} \\cdot \\dfrac{1+c^2}{2}$, dove $c^2 = \\sigma^2(S)/E[S]^2$ è il coefficiente di variazione al quadrato. Per l'esponenziale $c^2=1$ e si ritrova la formula M/M/1." },
  { id: 10.1, deck: 1, q: "Cos'è $c^2$ e perché è cruciale?", a: "$c^2 = \\sigma^2(S)/E[S]^2$ misura la variabilità del tempo di servizio. Più alta è la variabilità, più cresce l'attesa in coda. $c^2=0$ → deterministico (minima attesa); $c^2=1$ → esponenziale; $c^2>1$ → iper-variabile (es. hyperexponential)." },
  { id: 10.2, deck: 1, q: "Se aumento $\\lambda$ del 10/20%, come ricalcolo le metriche?", a: "Calcolo $\\lambda' = \\lambda \\cdot (1+f)$, poi $\\rho' = \\lambda'/\\mu$, e ricalcolo $E[T_q']$, $E[T_s']$ con le stesse formule ma usando $\\rho'$. Attenzione: se $\\rho'$ si avvicina a 1 le metriche esplodono in modo non lineare." },
  { id: 10.3, deck: 1, q: "Per $E[T_s]$ in M/G/1 conta molto il valore di $c^2$?", a: "$c^2$ incide pesantemente su $E[T_q]$ (parte di attesa). Su $E[T_s] = E[T_q]+E[S]$ l'effetto è attenuato perché $E[S]$ non dipende da $c^2$ e fa da 'base' costante." },

  // MAZZO 3
  { id: 11, deck: 2, q: "Differenza tra M/M/m (m server) e single server potenziato ($\\mu \\cdot m$).", a: "M/M/m: $m$ serventi paralleli, ciascuno con tasso $\\mu$; la coda è condivisa. Single potenziato: un solo servente $m$ volte più veloce ($\\mu'=m\\mu$). A parità di capacità totale il single potenziato è più veloce per il singolo job, ma il multiserver tollera meglio i picchi." },
  { id: 12, deck: 2, q: "Per M/M/1 in un sistema multi-centro, come ottengo $\\rho$ del singolo centro?", a: "Se gli arrivi totali $\\lambda$ si dividono su $m$ centri indipendenti: $\\rho = (\\lambda/m)/\\mu$. Ogni centro è un M/M/1 con tasso d'arrivo $\\lambda/m$." },
  { id: 13, deck: 2, q: "Formula di Erlang-C (probabilità di attesa, M/M/m con coda).", a: "$P(0) = \\left[\\sum_{i=0}^{m-1}\\dfrac{(m\\rho)^i}{i!} + \\dfrac{(m\\rho)^m}{m!(1-\\rho)}\\right]^{-1}$. Poi $P_Q = \\dfrac{(m\\rho)^m}{m!(1-\\rho)} \\cdot P(0)$ è la probabilità che tutti i serventi siano occupati (un job debba attendere)." },
  { id: 14, deck: 2, q: "Con Erlang-C, come calcolo $E[T_q]$ del multiserver?", a: "$E[T_q] = \\dfrac{P_Q \\cdot E[S]}{m(1-\\rho)}$. Poi $E[T_s] = E[T_q] + E[S]$." },
  { id: 15, deck: 2, q: "In M/M/m, $\\rho$ come si definisce?", a: "$\\rho = \\lambda/(m\\mu)$ = (massimo entra)/(massimo esce). È l'utilizzazione per servente; stabile se $\\rho<1$." },
  { id: 16, deck: 2, q: "Quando uso Erlang-B invece di Erlang-C?", a: "Erlang-B: multiserver SENZA coda (sistema a perdita / loss system). I job che non trovano server libero vengono persi. Erlang-C: multiserver CON coda infinita, i job attendono. Per coda finita serve Markov." },

  // MAZZO 4
  { id: 17, deck: 3, q: "Quando devo modellare il sistema con una catena di Markov?", a: "Quando la coda è finita (capacità limitata $N$) o quando ho un numero finito di stati con perdite. Sistema con coda finita → stazionario, e c'è probabilità di perdita $P_{\\text{loss}}$." },
  { id: 18, deck: 3, q: "Equazioni di bilanciamento globale (birth-death): come si scrivono?", a: "Bilancio il flusso entrante e uscente da ogni stato: $\\pi_0 \\cdot \\lambda = \\pi_1 \\cdot \\mu$ (stato 0↔1). In generale: $\\pi_i = (\\lambda/\\mu)^i \\cdot \\pi_0$, con $\\sum_i \\pi_i = 1$ per trovare $\\pi_0$." },
  { id: 19, deck: 3, q: "Come calcolo $P_{\\text{loss}}$ in una coda finita di capacità $N$?", a: "$P_{\\text{loss}} = \\pi_N = (\\lambda/\\mu)^N \\cdot \\pi_0$, cioè la probabilità di essere nello stato pieno. È la frazione di arrivi respinti." },
  { id: 20, deck: 3, q: "Con perdite, qual è il tasso d'arrivo effettivo e l'utilizzazione?", a: "$\\lambda' = \\lambda(1 - P_{\\text{loss}})$ (solo gli accettati entrano). Utilizzazione $\\rho' = \\lambda'/\\mu$. Throughput $X = \\min(\\lambda', \\mu)$." },
  { id: 21, deck: 3, q: "Multiserver a coda finita senza buffer: che modello uso?", a: "Erlang-B con catena di nascita-morte sui server attivi (stati $0..m$). Tasso di salita $\\lambda$ costante, tasso di discesa $i\\mu$ nello stato $i$. $\\pi_0 = \\left[\\sum_{i=0}^{m}\\dfrac{(\\lambda/\\mu)^i}{i!}\\right]^{-1}$, e $P_{\\text{loss}} = \\pi_m = \\dfrac{(\\lambda/\\mu)^m}{m!} \\cdot \\pi_0$." },
  { id: 22, deck: 3, q: "Come calcolo $E[N_s]$ (numero medio nel sistema) da una catena di Markov?", a: "$E[N_s] = \\sum_i i \\cdot \\pi_i = \\pi_1 \\cdot 1 + \\pi_2 \\cdot 2 + \\ldots + \\pi_N \\cdot N$. È la media pesata del numero di job con le probabilità di stato." },

  // MAZZO 5
  { id: 23, deck: 4, q: "Cosa significa scheduling Size-Based e quando si applica?", a: "Conosco la dimensione del job all'arrivo e partiziono il traffico in classi per dimensione (di solito rispetto a $E[S]$): classe 1 = job piccoli (size $\\leq E[S]$), classe 2 = job grandi. I piccoli hanno priorità. Migliora i tempi dei job corti." },
  { id: 24, deck: 4, q: "Come trovo le probabilità delle classi $p_k$ in size-based con servizio esponenziale?", a: "$p_k = F(x_k) - F(x_{k-1})$, con $F(t) = 1 - e^{-\\mu t}$. Es. classe 1 $(0, E[S])$: $p_1 = 1 - e^{-\\mu E[S]} = 1 - e^{-1} \\approx 0.6321$; $p_2 = 1 - p_1 \\approx 0.3679$." },
  { id: 25, deck: 4, q: "Come calcolo il tempo di servizio condizionato $E[S_k]$ di una classe?", a: "$E[S_k] = \\dfrac{1}{p_k}\\int_{x_{k-1}}^{x_k} t\\,f(t)\\,dt$, dove $f(t) = \\mu e^{-\\mu t}$ per l'esponenziale. Si risolve per parti: $\\int t\\,\\mu e^{-\\mu t}\\,dt = -t\\,e^{-\\mu t} - \\dfrac{1}{\\mu}e^{-\\mu t}$." },
  { id: 26, deck: 4, q: "Formula di $E[T_q]$ per la classe 1 (size-based NON preemptive).", a: "Classe 1 vede solo sé stessa (priorità più alta, no prelazione tra i propri): $E[T_{q1}] = \\dfrac{\\rho_1 \\cdot E[S_1]}{1-\\rho_1}$ con $\\rho_1 = \\lambda_1 E[S_1] = p_1 \\rho$." },
  { id: 27, deck: 4, q: "Formula di $E[T_q]$ per la classe 2 (size-based NON preemptive).", a: "La classe 2 (bassa priorità) 'vede tutta la coda': $E[T_{q2}] = \\dfrac{\\rho \\cdot E[S]}{(1-\\rho_1)(1-\\rho)}$. In generale per la classe $k$: denominatore $(1-\\sum_{i \\leq k}\\rho_i)(1-\\sum_{i<k}\\rho_i)$." },
  { id: 28, deck: 4, q: "Il size-based può peggiorare le prestazioni globali?", a: "No: il size-based (come l'SRPT) non è mai peggiorativo sulle singole classi e globalmente va sempre meglio o uguale rispetto all'Abstract. Per questo spesso si va 'diretti' con il size-based." },

  // MAZZO 6
  { id: 29, deck: 5, q: "Differenza chiave tra code NON preemptive e preemptive sui miglioramenti.", a: "Le code NON preemptive apportano solo miglioramenti locali (alle singole classi), NON migliorano la metrica globale del sistema. Le code preemptive (con prelazione) sono le uniche che portano miglioramenti globali." },
  { id: 30, deck: 5, q: "Quando i QoS riguardano metriche globali, quale meccanismo devo considerare?", a: "Devo passare al caso PREEMPTIVE (con prelazione), perché solo la prelazione modifica le prestazioni del sistema generale e non solo delle singole classi." },
  { id: 31, deck: 5, q: "Formula $E[T_{q1}]$ per la classe 1 con priorità preemptive (Abstract).", a: "La classe 1 vede solo sé stessa: $E[T_{q1}] = \\dfrac{\\rho_1 \\cdot E[S]}{1-\\rho_1}$, con $\\rho_1 = p_1 \\rho$." },
  { id: 32, deck: 5, q: "Cos'è il tempo di servizio VIRTUALE e quando serve?", a: "In prelazione un job di classe 2 può essere interrotto da uno di classe 1 e poi riprendere. Il tempo 'sentito' è dilatato: $E[S^{\\text{virt}}_k] = \\dfrac{E[S]}{1 - \\sum_{i<k}\\rho_i}$. Si usa per $E[T_{s2}] = E[T_{q2}] + E[S^{\\text{virt}}_2]$." },
  { id: 33, deck: 5, q: "Come imposto un problema di ottimizzazione di una QoS con guadagno/perdita?", a: "Definisco il rendimento atteso, es. $R = p_1 C_1 - p_2 C_2$, impongo il vincolo di QoS (es. $E[T_{q1}] = \\text{soglia}$) che lega $p_1$, risolvo per $p_1$, ricavo $p_2 = 1 - p_1$ e calcolo $R$. Scelgo la configurazione che massimizza $R$ rispettando i vincoli." },
  { id: 34, deck: 5, q: "Con arrivi Poisson e servizi esponenziali, la prelazione conviene sempre?", a: "NO. Con arrivi Poisson + servizi esponenziali la memorylessness annulla i vantaggi: $E[T_s]^{\\text{preemptive}} = E[T_s]^{\\text{non-preemptive}}$ per il valore globale. La prelazione migliora la classe 1 ma peggiora le altre, e in media si compensa." },
  { id: 35, deck: 5, q: "Relazione tra classi: $E[T_{si}] \\leq E[T_{s,i+1}]$?", a: "Sì, con priorità la classe a priorità più alta ha tempo di risposta minore. Si dimostra che $E[T_{qk}] \\leq E[T_{q,k+1}]$ e $E[S^{\\text{virt}}_k] \\leq E[S^{\\text{virt}}_{k+1}]$." },

  // MAZZO 7
  { id: 36, deck: 6, q: "Cos'è lo slowdown e come si definisce (condizionato a una size $x$)?", a: "Lo slowdown misura quanto un job è rallentato rispetto al suo servizio puro: $E[\\text{sd}(x)] = E[T_s(x)]/x = (E[T_q]+x)/x = E[T_q]/x + 1$. Job piccoli hanno slowdown più alto (sono penalizzati di più dall'attesa)." },
  { id: 37, deck: 6, q: "Slowdown medio in FIFO (caso esponenziale).", a: "$E[\\text{sd}] = 1 + \\dfrac{\\rho \\cdot E[S]}{x(1-\\rho)}$. Dipende dalla size $x$: per $x$ piccolo lo slowdown esplode." },
  { id: 38, deck: 6, q: "Slowdown in Processor Sharing (PS): perché è speciale?", a: "In PS (equo) lo slowdown è costante e indipendente dalla size: $E[\\text{sd}(x)] = \\dfrac{1}{1-\\rho}$ per ogni $x$. Questo è il grande vantaggio del PS: equità tra job grandi e piccoli." },
  { id: 39, deck: 6, q: "Cos'è lo scheduling SRPT?", a: "Shortest Remaining Processing Time: serve sempre il job con minor tempo residuo. È size-based con prelazione, ottimo per minimizzare il tempo di risposta medio. $F(t)$ rappresenta l'area (numero di job) fino alla size $t$." },
  { id: 40, deck: 6, q: "Formula $E[T_q(x)]$ in SRPT (size-based preemptive).", a: "$E[T_q(x)] = \\dfrac{\\dfrac{\\lambda}{2}\\int_0^x t^2\\,dF(t) + \\dfrac{\\lambda}{2}x^2(1-F(x))}{\\left(1 - \\lambda\\int_0^x t\\,dF(t)\\right)^2}$. Il numeratore considera il lavoro dei job $\\leq x$; il denominatore al quadrato l'utilizzazione 'vista' dai job di size $x$." },
  { id: 41, deck: 6, q: "Come trovo la % di job con $E[T_q] \\leq$ una soglia in SRPT?", a: "Poiché SRPT è size-based, $F(x)$ = frazione di job con size $\\leq x$. Calcolo la size $x^*$ corrispondente alla soglia e poi $F(x^*) = 1 - e^{-\\mu x^*}$ dà la percentuale di job sotto soglia." },

  // MAZZO 8
  { id: 42, deck: 7, q: "Quando uso una distribuzione Hyperexponential?", a: "Quando ho classi di carico diverse (es. 80% job leggeri, 20% pesanti) servite con tassi $\\mu$ diversi. La capacità del server è invariata, ma il mix di classi porta a $E[S]$ e $\\mu$ effettivi diversi, di cui faccio la media." },
  { id: 43, deck: 7, q: "Come ricavo i tassi delle fasi dell'Hyperexponential?", a: "Dalla condizione $p \\cdot E[S_1] + (1-p) \\cdot E[S_2] = E[S]$. Con $\\mu_i = 2p\\mu$ per la fase $i$ (caso bilanciato): $E[S_i] = E[S]/(2p)$. Si usa la struttura a fasi pesata dalle probabilità $p$ e $(1-p)$." },
  { id: 44, deck: 7, q: "Come calcolo $c^2$ (o $\\sigma^2$) per un Hyperexponential?", a: "$\\sigma^2(S) = g(\\rho) \\cdot E[S]^2$ con $g(\\rho) = \\dfrac{1}{2\\rho(1-\\rho)} - 1$ nei casi visti; oppure $\\sigma^2(S) = E[S^2] - E[S]^2$. Poi $E[S^2] = \\sigma^2 + E[S]^2$. $E[S^2]$ serve nelle formule P-K per $E[T_q]$." },
  { id: 45, deck: 7, q: "Perché nelle formule con Hyperexp serve $E[S^2]$ e non solo $E[S]$?", a: "Perché l'attesa in coda dipende dal secondo momento del servizio: $E[T_q] = \\dfrac{\\lambda \\cdot E[S^2]}{2(1-\\rho)}$ (Pollaczek-Khinchine in forma di momenti). L'iper-variabilità si manifesta tramite $E[S^2]$." },
  { id: 46, deck: 7, q: "Con servizi esponenziali, $E[T_s]$ dipende dalle partizioni delle classi?", a: "NO. In regime esponenziale $E[T_s]$ è indipendente dalle partizioni delle classi (la proprietà memoryless rende ininfluente come dividi il traffico). Lo si dimostra sviluppando $E[T_s]$ a 2 code e vedendo che $p_1 \\rho$ ricompare uguale." },

  // MAZZO 9
  { id: 47, deck: 8, q: "Legge dell'utilizzazione (Utilization Law).", a: "$U_i = X_i \\cdot S_i = X_0 V_i S_i = X_0 D_i$. L'utilizzazione di una risorsa = throughput × tempo di servizio. Da qui ricavo $X_i = U_i/S_i$." },
  { id: 48, deck: 8, q: "Legge del flusso forzato (Forced Flow Law).", a: "$X_i = X_0 \\cdot V_i$: il throughput di un centro = throughput del sistema × numero di visite a quel centro. $V_i = X_i/X_0$." },
  { id: 49, deck: 8, q: "Legge della domanda (Service Demand).", a: "$D_i = V_i \\cdot S_i = U_i/X_0$. La domanda è il lavoro totale richiesto a un centro per job. Attenzione: $D_i = V_i \\cdot S_i$, le visite contano!" },
  { id: 50, deck: 8, q: "Formula del tempo di risposta interattivo (Response Time Law).", a: "$R = N/X_0 - Z$ ($N$ utenti, $Z$ think time). Da qui posso ricavare anche $N = (R+Z) \\cdot X_0$, oppure $Z = N/X_0 - R$, oppure $X_0 = N/(R+Z)$." },
  { id: 51, deck: 8, q: "Come trovo $X_0$ se conosco l'utilizzazione di un disco e il suo servizio?", a: "Da $U_{\\text{DISK}} = X_0 \\cdot V_{\\text{DISK}} \\cdot S_{\\text{DISK}}$ → $X_0 = \\dfrac{U_{\\text{DISK}}}{V_{\\text{DISK}} \\cdot S_{\\text{DISK}}} = \\dfrac{U_{\\text{DISK}}}{D_{\\text{DISK}}}$." },
  { id: 52, deck: 8, q: "In un sistema misto (batch+interattivo), come separo i throughput sul disco?", a: "Il disco è condiviso: $X_{\\text{DISK}} = X_{\\text{DISK}}^B + X_{\\text{DISK}}^I$. Trovo $X_{\\text{DISK}}$ totale da $U_{\\text{DISK}}/S_{\\text{DISK}}$, calcolo $X_{\\text{DISK}}^I = X_0^I \\cdot V_{\\text{DISK}}^I$, e per differenza ottengo $X_{\\text{DISK}}^B$." },
  { id: 53, deck: 8, q: "Upper bound del throughput in una rete chiusa.", a: "$X(N) \\leq \\min\\!\\left(\\dfrac{1}{D_{\\max}},\\, \\dfrac{N}{D+Z}\\right)$, dove $D_{\\max}$ è la domanda del collo di bottiglia e $D = \\sum D_i$. Per $N$ piccoli domina $N/(D+Z)$; per $N$ grandi domina $1/D_{\\max}$." },
  { id: 54, deck: 8, q: "Come trovo $N^*$ (punto di ginocchio della curva del throughput)?", a: "È il punto dove le due rette si incontrano: impongo $1/D_{\\max} = N^*/(D+Z)$ → $N^* = (D+Z)/D_{\\max}$. Prima di $N^*$ il sistema scala linearmente, dopo satura sul bottleneck." },
  { id: 55, deck: 8, q: "Come identifico il collo di bottiglia (bottleneck)?", a: "È il centro con domanda massima $D_{\\max} = \\max_i(V_i \\cdot S_i)$. Determina il throughput massimo asintotico $1/D_{\\max}$ e satura per primo (utilizzazione $\\to 1$)." },
  { id: 56, deck: 8, q: "Numero di terminali 'pensanti' (#think).", a: "$\\#\\text{think} = X_0 \\cdot Z$ (per Little applicata al gruppo dei terminali in think time). Sono gli utenti che mediamente stanno pensando, non interagendo." },

  // MAZZO 10
  { id: 57, deck: 9, q: "Quando applico MVA e qual è l'idea di base?", a: "Per reti chiuse quando voglio il valore esatto (non un bound). È iterativo: parto da $N=0$, calcolo gli indici, passo a $N=1$, poi $N=2$, ... fino a $N$. Ricorsivo perché il sistema con $N$ job usa i risultati con $N-1$." },
  { id: 58, deck: 9, q: "Le tre formule MVA per ogni iterazione $N$.", a: "1) Tempo: $R_i(N) = D_i \\cdot (1 + E[m_i(N-1)])$.\n2) Throughput: $X_0(N) = \\dfrac{N}{Z + \\sum_i V_i R_i(N)}$.\n3) Popolazione: $E[m_i(N)] = X_0(N) \\cdot R_i(N)$ (Little per centro)." },
  { id: 59, deck: 9, q: "Come parte l'iterazione MVA (caso base)?", a: "$E[m_i(0)] = 0$ per ogni centro (con 0 job, nessun centro è popolato). Poi $R_i(1) = D_i \\cdot (1+0) = D_i$." },
  { id: 60, deck: 9, q: "Differenza tra MVA 'classico' e 'riadattato globale'.", a: "Nel MVA classico calcolo $\\lambda_i$ per ogni centro. Nel riadattato globale cerco $X_0(N) = N/\\sum_i R_i(N)$ per ottenere un tempo di risposta totale del sistema, non per singolo centro." },
  { id: 61, deck: 9, q: "Come calcolo le visite $V_{ij}$ da una matrice di routing?", a: "Risolvo le equazioni di bilanciamento dei flussi (visite relative): fisso una visita di riferimento (es. $y_1=1$) e propago. $V_{ij} = y_i/y_j$. Le visite rispetto al riferimento danno la matrice di routing equivalente." },
  { id: 62, deck: 9, q: "Verifica di correttezza durante MVA.", a: "La somma delle popolazioni deve dare $N$: $\\sum_i E[m_i(N)] = N$. Es. con $N=2$: $E[m_1(2)]+E[m_2(2)] = 2$. Se non torna, c'è un errore nei calcoli." },
  { id: 63, deck: 9, q: "In MVA, posso usare $R = N/X_0 - Z$ per il tempo di risposta?", a: "Solo per sistemi interattivi (con think time $Z$ e terminali). In una rete chiusa pura senza terminali, $R_{\\text{TOT}} = \\sum_i R_i(N)$ direttamente dalle iterazioni, NON con quella formula." },

  // MAZZO 11
  { id: 64, deck: 10, q: "Cosa garantisce il teorema di Jackson / Burke?", a: "In una rete di Jackson ogni centro si comporta come un M/M/1 indipendente con il proprio $\\lambda_i$. Ciò che esce da un centro entra (in forma Poisson) nel successivo. La rete è separabile: studio ogni centro in modo indipendente." },
  { id: 65, deck: 10, q: "Come scrivo le equazioni di flusso (traffico) in una rete aperta?", a: "Per ogni centro: $\\lambda_i = \\gamma P_{si} + \\sum_j \\lambda_j P_{ji}$. Sistema lineare nelle $\\lambda_i$; risolvo per sostituzione. Le $\\lambda_i$ sono i tassi di arrivo effettivi a ciascun centro." },
  { id: 66, deck: 10, q: "Tempo di risposta del singolo centro M/M/1 in rete di Jackson.", a: "$E[T_{si}] = \\dfrac{1}{\\mu_i - \\lambda_i}$. Vale perché ogni centro è un M/M/1 con il suo $\\lambda_i$ (Jackson). Richiede $\\mu_i > \\lambda_i$ (centro stabile)." },
  { id: 67, deck: 10, q: "Tempo di risposta dell'intero sistema (rete aperta).", a: "$E[T_r] = \\sum_i V_i \\cdot E[T_{si}]$, con $V_i = \\lambda_i/\\gamma$ (visite rispetto all'arrivo esterno $\\gamma$). Pesa il tempo di ogni centro per quante volte viene visitato." },
  { id: 68, deck: 10, q: "Come trovo il $\\gamma_{\\max}$ ammissibile in una rete aperta?", a: "Impongo $\\rho_i = \\lambda_i/\\mu_i < 1$ per OGNI centro. Ricavo il vincolo su $\\gamma$ da ciascuno e prendo il più stringente (il minimo). Il centro che satura per primo determina $\\gamma_{\\max}$." },
  { id: 69, deck: 10, q: "Come impongo che due centri abbiano la stessa utilizzazione?", a: "Impongo $\\rho_i = \\rho_j$ → $\\lambda_i/\\mu_i = \\lambda_j/\\mu_j$. Combino con le equazioni di flusso (che dipendono dalle probabilità di routing incognite) e risolvo per le probabilità $P_{ij}$." },
  { id: 70, deck: 10, q: "Come minimizzo il tempo di risposta scegliendo le probabilità di routing?", a: "Guardo quale centro 'rallenta di più' ($E[T_s]$ maggiore) e mando meno visite a quel centro, più visite a quelli veloci. Aggiusto $P_{ij}$ di conseguenza." },
  { id: 71, deck: 10, q: "Calcolo delle visite rispetto all'arrivo esterno $\\gamma$.", a: "$V_i = \\lambda_i/\\gamma$. Es. se $\\lambda_1 = 6$ e $\\gamma = 10$ → $V_1 = 0.6$. Rappresenta quante volte mediamente un job esterno passa dal centro $i$." },

  // MAZZO 12
  { id: 72, deck: 11, q: "Sistema chiuso M/M/1/2 (pochi job): come lo risolvo?", a: "Catena di Markov sugli stati 0,1,2. Equazioni di bilanciamento: $\\pi_0 \\lambda = \\pi_1 \\mu$, ecc. → $\\pi_i = (\\lambda/\\mu)^i \\pi_0$, normalizzo con $\\sum_i \\pi_i=1$. Poi $E[N] = \\sum i \\cdot \\pi_i$ e $\\sigma^2 = \\sum i^2 \\pi_i - (\\sum i \\pi_i)^2$." },
  { id: 73, deck: 11, q: "Come trovo la condizione di stazionarietà con parametri liberi (es. prob. $p$)?", a: "Scrivo le entrate $\\lambda'_i$ in funzione di $p$, impongo $\\rho_i = \\lambda'_i/\\mu_i < 1$ per ogni centro, ricavo il vincolo su $p$ da ciascuno e prendo l'intersezione (il più stringente)." },
  { id: 74, deck: 11, q: "Media e varianza del numero di richieste da una distribuzione stazionaria.", a: "$E[N] = \\sum_i i \\cdot \\pi_i$; $\\sigma^2(N) = E[N^2] - E[N]^2 = \\sum_i i^2 \\pi_i - \\left(\\sum_i i \\pi_i\\right)^2$. Servono le $\\pi_i$ normalizzate." },
  { id: 75, deck: 11, q: "Probabilità che il sistema sia vuoto.", a: "È $\\pi_0$, il primo termine della distribuzione stazionaria, ottenuto dalla normalizzazione: $\\pi_0 = \\left(1 + \\lambda/\\mu + 2(\\lambda/\\mu)^2 + \\ldots\\right)^{-1}$ a seconda della struttura." },
  { id: 76, deck: 11, q: "Throughput di un sistema con perdite (da Markov).", a: "$X = \\min(\\lambda', \\mu)$ con $\\lambda' = \\lambda(1 - P_{\\text{loss}})$. Il throughput effettivo tiene conto solo dei job che entrano davvero nel sistema." },

  // MAZZO 13
  { id: 77, deck: 12, q: "Cumulativa ed area dell'esponenziale che usi sempre.", a: "$F(t) = 1 - e^{-\\mu t}$, densità $f(t) = \\mu e^{-\\mu t}$. Valori chiave: $F(E[S]) = F(1/\\mu) = 1 - e^{-1} \\approx 0.6321$; coda $1 - F(E[S]) \\approx 0.3679$." },
  { id: 78, deck: 12, q: "Come si risolve $\\int t\\,\\mu e^{-\\mu t}\\,dt$ (per il calcolo di $E[S_k]$)?", a: "Per parti ($f=t$, $g'=\\mu e^{-\\mu t}$): $\\int t\\,\\mu e^{-\\mu t}\\,dt = -t\\,e^{-\\mu t} - \\dfrac{1}{\\mu}e^{-\\mu t} + C$. Si valuta tra gli estremi della classe." },
  { id: 79, deck: 12, q: "Tempo di servizio condizionato per una distribuzione Uniforme$(a,b)$.", a: "$F(x) = (x-a)/(b-a)$. Per una classe $[x_{k-1}, x_k]$: $E[S_k] = \\dfrac{1}{p_k}\\int t\\,f(t)\\,dt$ con $f(t) = 1/(b-a)$. Es. Uniforme$(2,15)$, classe $\\leq 8.5$: $p=0.5$, $E[S_1] = 5.25$ min." },
  { id: 80, deck: 12, q: "Varianza e secondo momento di una Uniforme$(a,b)$.", a: "$\\sigma^2 = \\dfrac{(b-a)^2}{12}$, media $= \\dfrac{a+b}{2}$. Secondo momento $E[S^2] = \\sigma^2 + E[S]^2$. Serve nelle formule di attesa." },
  { id: 81, deck: 12, q: "Relazione generale tra $E[S^2]$, $\\sigma^2$ ed $E[S]$.", a: "$E[S^2] = \\sigma^2(S) + E[S]^2$. Per l'esponenziale $\\sigma^2 = E[S]^2 = 1/\\mu^2$, quindi $E[S^2] = 2E[S]^2 = 2/\\mu^2$." },
  { id: 82, deck: 12, q: "Perché in size-based $p_k$ dipende da $\\mu$ e non da $\\lambda$?", a: "$p_k$ è la probabilità che un job cada in una fascia di dimensione: dipende dalla cumulativa del tempo di servizio (governata da $\\mu$, la domanda media). $\\lambda$ è il processo d'arrivo (Poisson) e non c'entra con la dimensione del singolo job." },
].map((c, i) => ({ ...c, id: i + 1 }));
