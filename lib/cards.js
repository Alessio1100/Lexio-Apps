// 85 flashcard PMCSN — 13 mazzi
// Generato dal file Flashcard_PMCSN.docx
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
  { id: 1, deck: 0, q: "Come si calcola l'utilizzazione ρ di un M/M/1?", a: "ρ = λ/μ = λ·E[S]. Valida solo se λ < μ (sistema stabile/stazionario). Se λ ≥ μ il sistema collassa." },
  { id: 2, deck: 0, q: "Legge di Little: enunciato e forme che usi più spesso.", a: "E[N] = λ·E[T] (numero medio nel sistema = arrivi × tempo medio). Forme derivate: E[Nq] = λ·E[Tq] (coda), E[Ns] = λ·E[Ts] (sistema). Serve per passare da un numero medio a un tempo medio e viceversa." },
  { id: 3, deck: 0, q: "Ho E[Nq] e λ, voglio E[Tq]. Come faccio?", a: "Inverto Little sulla coda: E[Tq] = E[Nq]/λ. Es: E[Nq]=0.225, λ=0.45 → E[Tq]=0.5 s." },
  { id: 4, deck: 0, q: "Relazione tra tempo di risposta e tempo di attesa.", a: "E[Ts] = E[Tq] + E[S] (risposta = attesa in coda + servizio). In alternativa via Little: E[Ts] = E[Ns]/λ = (E[Nq]+ρ)/λ." },
  { id: 5, deck: 0, q: "Quando ρ → 1, perché non posso più usare Little per E[Ts]?", a: "Quando ρ → 1 il sistema satura: E[Ts] → +∞ e non vale più la relazione E[Ts] = E[Ns]/λ in forma utile. Il sistema non è più stazionario." },
  { id: 6, deck: 0, q: "Ho E[S] e voglio μ (o viceversa).", a: "μ = 1/E[S] ed E[S] = 1/μ. Sono inversi: μ è un tasso (job/s), E[S] è un tempo (s)." },
  { id: 7, deck: 0, q: "Per un web server: come ricavo E[S] da capacità C e domanda Z?", a: "E[S] = Z/C (domanda in op/job diviso capacità in op/s = secondi/job). Poi μ = 1/E[S] = C/Z." },
  { id: 8, deck: 0, q: "Di quanto deve crescere λ per portare il sistema al collasso?", a: "Cerco il fattore x tale che x·ρ = 1, cioè x = 1/ρ = μ/λ. Es: ρ=0.45 → x=2.22, ossia +122%. A quel punto ρ→1 e E[Ts]→∞." },

  // MAZZO 2
  { id: 9, deck: 1, q: "Formula del tempo di attesa per M/M/1 (servizio esponenziale).", a: "E[Tq] = ρ·E[S] / (1−ρ). Poi E[Ts] = E[Tq] + E[S] = E[S]/(1−ρ)." },
  { id: 10, deck: 1, q: "Formula di Pollaczek-Khinchine per M/G/1 (servizio generico).", a: "E[Tq] = [ρ·E[S]/(1−ρ)] · (1+c²)/2, dove c² = σ²(S)/E[S]² è il coefficiente di variazione al quadrato. Per l'esponenziale c²=1 e si ritrova la formula M/M/1." },
  { id: 10.1, deck: 1, q: "Cos'è c² e perché è cruciale?", a: "c² = σ²(S)/E[S]² misura la variabilità del tempo di servizio. Più alta è la variabilità, più cresce l'attesa in coda. c²=0 → deterministico (minima attesa); c²=1 → esponenziale; c²>1 → iper-variabile (es. hyperexponential)." },
  { id: 10.2, deck: 1, q: "Se aumento λ del 10/20%, come ricalcolo le metriche?", a: "Calcolo λ' = λ·(1+frazione), poi ρ' = λ'/μ, e ricalcolo E[Tq'], E[Ts'] con le stesse formule ma usando ρ'. Attenzione: se ρ' si avvicina a 1 le metriche esplodono in modo non lineare." },
  { id: 10.3, deck: 1, q: "Per E[Ts] in M/G/1 conta molto il valore di c²?", a: "c² incide pesantemente su E[Tq] (parte di attesa). Su E[Ts] = E[Tq]+E[S] l'effetto è attenuato perché E[S] non dipende da c² e fa da 'base' costante." },

  // MAZZO 3
  { id: 11, deck: 2, q: "Differenza tra M/M/m (m server) e single server potenziato (μ·m).", a: "M/M/m: m serventi paralleli, ciascuno con tasso μ; la coda è condivisa. Single potenziato: un solo servente m volte più veloce (μ'=m·μ). A parità di capacità totale il single potenziato è più veloce per il singolo job, ma il multiserver tollera meglio i picchi." },
  { id: 12, deck: 2, q: "Per M/M/1 in un sistema multi-centro, come ottengo ρ del singolo centro?", a: "Se gli arrivi totali λ si dividono su m centri indipendenti: ρ = (λ/m)/μ. Ogni centro è un M/M/1 con tasso d'arrivo λ/m." },
  { id: 13, deck: 2, q: "Formula di Erlang-C (probabilità di attesa, M/M/m con coda).", a: "Serve P(0) = [ Σ_{i=0}^{m−1} (mρ)^i/i! + (mρ)^m/(m!(1−ρ)) ]^(−1). Poi P_Q = (mρ)^m/(m!(1−ρ)) · P(0) è la probabilità che tutti i serventi siano occupati (un job debba attendere)." },
  { id: 14, deck: 2, q: "Con Erlang-C, come calcolo E[Tq] del multiserver?", a: "E[Tq] = P_Q · E[S] / (m·(1−ρ)) = P_Q·E[Si]/(1−ρ) con E[Si] tempo servizio del singolo server. Poi E[Ts]=E[Tq]+E[S]." },
  { id: 15, deck: 2, q: "In M/M/m, ρ come si definisce?", a: "ρ = λ/(m·μ) = (massimo entra)/(massimo esce). È l'utilizzazione per servente; stabile se ρ<1." },
  { id: 16, deck: 2, q: "Quando uso Erlang-B invece di Erlang-C?", a: "Erlang-B: multiserver SENZA coda (sistema a perdita / loss system). I job che non trovano server libero vengono persi. Erlang-C: multiserver CON coda infinita, i job attendono. Mai usare buffer finito con queste due: per coda finita serve Markov." },

  // MAZZO 4
  { id: 17, deck: 3, q: "Quando devo modellare il sistema con una catena di Markov?", a: "Quando la coda è finita (capacità limitata N) o quando ho un numero finito di stati con perdite. Sistema con coda finita → stazionario, e c'è probabilità di perdita PLOSS." },
  { id: 18, deck: 3, q: "Equazioni di bilanciamento globale (birth-death): come si scrivono?", a: "Bilancio il flusso entrante e uscente da ogni stato: π0·λ = π1·μ (stato 0↔1), π1·(λ+μ) = π0·λ + π2·μ (stato 1), ecc. Generale: πi = (λ/μ)^i · π0, con Σ πi = 1 per trovare π0." },
  { id: 19, deck: 3, q: "Come calcolo PLOSS in una coda finita di capacità N?", a: "PLOSS = πN = (λ/μ)^N · π0, cioè la probabilità di essere nello stato pieno. È la frazione di arrivi respinti." },
  { id: 20, deck: 3, q: "Con perdite, qual è il tasso d'arrivo effettivo e l'utilizzazione?", a: "λ' = λ·(1 − PLOSS) (solo gli accettati entrano). Utilizzazione ρ' = λ'/μ. Throughput X = min(λ', μ)." },
  { id: 21, deck: 3, q: "Multiserver a coda finita senza buffer: che modello uso?", a: "Erlang-B con catena di nascita-morte sui server attivi (stati 0..m). Tasso di salita λ costante, tasso di discesa i·μ nello stato i. π0 = [ Σ (λ/μ)^i / i! ]^(−1), e PLOSS = πm = (λ/μ)^m/m! · π0." },
  { id: 22, deck: 3, q: "Come calcolo E[Ns] (numero medio nel sistema) da una catena di Markov?", a: "E[Ns] = Σ i·πi = π1·1 + π2·2 + … + πN·N. È la media pesata del numero di job/serventi attivi con le probabilità di stato." },

  // MAZZO 5
  { id: 23, deck: 4, q: "Cosa significa scheduling Size-Based e quando si applica?", a: "Conosco la dimensione del job all'arrivo e partiziono il traffico in classi per dimensione (di solito rispetto a E[S]): classe 1 = job piccoli (size ≤ E[S]), classe 2 = job grandi. I piccoli hanno priorità. Migliora i tempi dei job corti." },
  { id: 24, deck: 4, q: "Come trovo le probabilità delle classi p_k in size-based con servizio esponenziale?", a: "p_k = differenza della cumulativa nell'intervallo della classe: p_k = F(x_k) − F(x_{k−1}), con F(t)=1−e^(−μt). Es. classe 1 (0, E[S]): p1 = 1−e^(−μ·E[S]) = 1−e^(−1) ≈ 0.6321; p2 = 1−p1 ≈ 0.3679." },
  { id: 25, deck: 4, q: "Come calcolo il tempo di servizio condizionato E[S_k] di una classe?", a: "E[S_k] = (1/p_k) ∫_{x_{k−1}}^{x_k} t·f(t) dt, dove f(t)=μe^(−μt) per l'esponenziale. Si risolve per parti: ∫ t·μe^(−μt) dt = [−t·e^(−μt) − (1/μ)e^(−μt)]." },
  { id: 26, deck: 4, q: "Formula di E[Tq] per la classe 1 (size-based NON preemptive).", a: "Classe 1 vede solo sé stessa (priorità più alta, no prelazione tra i propri): E[Tq1] = ρ1·E[S1]/(1−ρ1) con ρ1 = λ1·E[S1] = p1·ρ." },
  { id: 27, deck: 4, q: "Formula di E[Tq] per la classe 2 (size-based NON preemptive).", a: "La classe 2 (bassa priorità) 'vede tutta la coda': E[Tq2] = ρ·E[S] / [(1−ρ1)·(1−ρ)] (forma con utilizzazioni cumulate). In generale per la classe k: denominatore (1−Σ_{i≤k}ρi)(1−Σ_{i<k}ρi)." },
  { id: 28, deck: 4, q: "Il size-based può peggiorare le prestazioni globali?", a: "No: il size-based (come l'SRPT) non è mai peggiorativo sulle singole classi e globalmente va sempre meglio o uguale rispetto all'Abstract. Per questo spesso si va 'diretti' con il size-based." },

  // MAZZO 6
  { id: 29, deck: 5, q: "Differenza chiave tra code NON preemptive e preemptive sui miglioramenti.", a: "Le code NON preemptive apportano solo miglioramenti locali (alle singole classi), NON migliorano la metrica globale del sistema. Le code preemptive (con prelazione) sono le uniche che portano miglioramenti globali." },
  { id: 30, deck: 5, q: "Quando i QoS riguardano metriche globali, quale meccanismo devo considerare?", a: "Devo passare al caso PREEMPTIVE (con prelazione), perché solo la prelazione modifica le prestazioni del sistema generale e non solo delle singole classi." },
  { id: 31, deck: 5, q: "Formula E[Tq1] per la classe 1 con priorità preemptive (Abstract).", a: "La classe 1 vede solo sé stessa: E[Tq1] = ρ1·E[S]/(1−ρ1), con ρ1 = p1·ρ. (p1 = frazione di traffico in classe 1)." },
  { id: 32, deck: 5, q: "Cos'è il tempo di servizio VIRTUALE e quando serve?", a: "In prelazione un job di classe 2 può essere interrotto da uno di classe 1 e poi riprendere. Il tempo che 'sente' è dilatato: E[Svirt_k] = E[S] / (1 − Σ_{i<k} ρi). Si usa per E[Ts2] = E[Tq2] + E[Svirt_2]." },
  { id: 33, deck: 5, q: "Come imposto un problema di ottimizzazione di una QoS con guadagno/perdita?", a: "Definisco il rendimento atteso, es. R = p1·C1 − p2·C2, impongo il vincolo di QoS (es. E[Tq1]=soglia) che lega p1, risolvo per p1, ricavo p2=1−p1 e calcolo R. Scelgo la configurazione che massimizza R rispettando i vincoli." },
  { id: 34, deck: 5, q: "Con arrivi Poisson e servizi esponenziali, la prelazione conviene sempre?", a: "NO. Con arrivi Poisson + servizi esponenziali la memorylessness annulla i vantaggi: E[Ts]^(preemptive) = E[Ts]^(non-preemptive) per il valore globale. La prelazione migliora la classe 1 ma peggiora le altre, e in media si compensa." },
  { id: 35, deck: 5, q: "Relazione tra classi: E[Ts_i] ≤ E[Ts_{i+1}]?", a: "Sì, con priorità la classe a priorità più alta ha tempo di risposta minore: il numeratore cresce e il denominatore cala passando a classi inferiori. Si dimostra che E[Tq_k] ≤ E[Tq_{k+1}] e E[Svirt_k] ≤ E[Svirt_{k+1}]." },

  // MAZZO 7
  { id: 36, deck: 6, q: "Cos'è lo slowdown e come si definisce (condizionato a una size x)?", a: "Lo slowdown misura quanto un job è rallentato rispetto al suo servizio puro: E[sd(x)] = E[Ts(x)]/x = (E[Tq]+x)/x = E[Tq]/x + 1. Job piccoli hanno slowdown più alto (sono penalizzati di più dall'attesa)." },
  { id: 37, deck: 6, q: "Slowdown medio in FIFO (caso esponenziale).", a: "E[sd] = 1 + ρ·E[S]/(x·(1−ρ)). Dipende dalla size x: per x piccolo lo slowdown esplode." },
  { id: 38, deck: 6, q: "Slowdown in Processor Sharing (PS): perché è speciale?", a: "In PS (equo) lo slowdown è costante e indipendente dalla size: E[sd(x)] = 1/(1−ρ) per ogni x. Questo è il grande vantaggio del PS: equità tra job grandi e piccoli." },
  { id: 39, deck: 6, q: "Cos'è lo scheduling SRPT?", a: "Shortest Remaining Processing Time: serve sempre il job con minor tempo residuo. È size-based con prelazione, ottimo per minimizzare il tempo di risposta medio. F(t) rappresenta l'area (numero di job) fino alla size t." },
  { id: 40, deck: 6, q: "Formula E[Tq(x)] in SRPT (size-based preemptive).", a: "E[Tq(x)] = [ (λ/2)∫_0^x t²dF(t) + (λ/2)x²(1−F(x)) ] / (1 − λ∫_0^x t·dF(t))². Il numeratore considera il lavoro dei job ≤ x; il denominatore al quadrato l'utilizzazione 'vista' dai job di size x." },
  { id: 41, deck: 6, q: "Come trovo la % di job con E[Ta] ≤ una soglia in SRPT?", a: "Poiché SRPT è size-based, F(x) = frazione di job con size ≤ x. Calcolo la size x* corrispondente alla soglia e poi F(x*) = 1 − e^(−μ·x*) dà la percentuale di job sotto soglia." },

  // MAZZO 8
  { id: 42, deck: 7, q: "Quando uso una distribuzione Hyperexponential?", a: "Quando ho classi di carico diverse (es. 80% job leggeri, 20% pesanti) servite con tassi μ diversi. La capacità del server è invariata, ma il mix di classi porta a E[S] e μ effettivi diversi, di cui faccio la media." },
  { id: 43, deck: 7, q: "Come ricavo i tassi delle fasi dell'Hyperexponential?", a: "Dalla condizione p·E[S1] + (1−p)·E[S2] = E[S]. Con μ_i = 2p·μ per la fase i (caso bilanciato): E[S_i] = E[S]/(2p) ecc. Si usa la struttura a fasi pesata dalle probabilità p e (1−p)." },
  { id: 44, deck: 7, q: "Come calcolo c² (o σ²) per un Hyperexponential?", a: "σ²(S) = g(ρ)·E[S]² con g(ρ) = 1/(2ρ(1−ρ)) − 1 nei casi visti; oppure direttamente σ²(S)=E[S²]−E[S]². Poi E[S²] = σ² + E[S]². E[S²] serve nelle formule P-K per E[Tq]." },
  { id: 45, deck: 7, q: "Perché nelle formule con Hyperexp serve E[S²] e non solo E[S]?", a: "Perché l'attesa in coda dipende dal secondo momento del servizio: E[Tq] = (λ/2)·E[S²]/(1−ρ) (Pollaczek-Khinchine in forma di momenti). L'iper-variabilità si manifesta tramite E[S²]." },
  { id: 46, deck: 7, q: "Con servizi esponenziali, E[Ts] dipende dalle partizioni delle classi?", a: "NO. In regime esponenziale E[Ts] è indipendente dalle partizioni delle classi (la proprietà memoryless rende ininfluente come dividi il traffico). Lo si dimostra sviluppando E[Ta] a 2 code e vedendo che p1·p ricompare uguale." },

  // MAZZO 9
  { id: 47, deck: 8, q: "Legge dell'utilizzazione (Utilization Law).", a: "U_i = X_i · S_i = X0·V_i·S_i = X0·D_i. L'utilizzazione di una risorsa = throughput × tempo di servizio. Da qui ricavo X_i = U_i/S_i." },
  { id: 48, deck: 8, q: "Legge del flusso forzato (Forced Flow Law).", a: "X_i = X0 · V_i: il throughput di un centro = throughput del sistema × numero di visite a quel centro. V_i = X_i/X0." },
  { id: 49, deck: 8, q: "Legge della domanda (Service Demand).", a: "D_i = V_i · S_i = U_i/X0. La domanda è il lavoro totale richiesto a un centro per job. Attenzione: D_i = V_i·S_i, le visite contano!" },
  { id: 50, deck: 8, q: "Formula del tempo di risposta interattivo (Response Time Law).", a: "R = N/X0 − Z (N utenti, Z think time). Da qui posso ricavare anche N = (R+Z)·X0, oppure Z = N/X0 − R, oppure X0 = N/(R+Z)." },
  { id: 51, deck: 8, q: "Come trovo X0 se conosco l'utilizzazione di un disco e il suo servizio?", a: "Da U_DISK = X0·V_DISK·S_DISK → X0 = U_DISK/(V_DISK·S_DISK) = U_DISK/D_DISK. Combino utilizzazione + flusso forzato + domanda." },
  { id: 52, deck: 8, q: "In un sistema misto (batch+interattivo), come separo i throughput sul disco?", a: "Il disco è condiviso: X_DISK = X_DISK^B + X_DISK^I. Trovo X_DISK totale da U_DISK/S_DISK, calcolo la parte interattiva X_DISK^I = X0^I·V_DISK^I, e per differenza ottengo la batch X_DISK^B." },
  { id: 53, deck: 8, q: "Upper bound del throughput in una rete chiusa.", a: "X(N) ≤ min( 1/D_MAX , N/(D+Z) ), dove D_MAX è la domanda del collo di bottiglia e D = ΣD_i. Per N piccoli domina N/(D+Z); per N grandi domina 1/D_MAX." },
  { id: 54, deck: 8, q: "Come trovo N* (punto di ginocchio della curva del throughput)?", a: "È il punto dove le due rette si incontrano: impongo 1/D_MAX = N*/(D+Z) → N* = (D+Z)/D_MAX. Prima di N* il sistema scala linearmente, dopo satura sul bottleneck." },
  { id: 55, deck: 8, q: "Come identifico il collo di bottiglia (bottleneck)?", a: "È il centro con domanda massima D_MAX = max(V_i·S_i). Determina il throughput massimo asintotico 1/D_MAX e satura per primo (utilizzazione → 1)." },
  { id: 56, deck: 8, q: "Numero di terminali 'pensanti' (#think).", a: "#think = X0·Z (per Little applicata al gruppo dei terminali in think time). Sono gli utenti che mediamente stanno pensando, non interagendo." },

  // MAZZO 10
  { id: 57, deck: 9, q: "Quando applico MVA e qual è l'idea di base?", a: "Per reti chiuse quando voglio il valore esatto (non un bound). È iterativo: parto da N=0, calcolo gli indici, passo a N=1, poi N=2, ... fino a N. Ricorsivo perché il sistema con N job usa i risultati con N−1." },
  { id: 58, deck: 9, q: "Le tre formule MVA per ogni iterazione N.", a: "1) Tempo: R_i(N) = D_i·(1 + E[m_i(N−1)]) (o con E[S_i] e visite). 2) Throughput: X0(N) = N / (Z + Σ V_i·R_i(N)) (riadattato: Σ R_i se globale). 3) Popolazione: E[m_i(N)] = X0(N)·R_i(N) (Little per centro)." },
  { id: 59, deck: 9, q: "Come parte l'iterazione MVA (caso base)?", a: "E[m_i(0)] = 0 per ogni centro (con 0 job, nessun centro è popolato). Poi R_i(1) = D_i·(1+0) = D_i." },
  { id: 60, deck: 9, q: "Differenza tra MVA 'classico' e 'riadattato globale'.", a: "Nel MVA classico calcolo λ_i per ogni centro. Nel riadattato globale cerco X0(N) = N/ΣR_i(N) per ottenere un tempo di risposta totale del sistema, non per singolo centro." },
  { id: 61, deck: 9, q: "Come calcolo le visite V_ij da una matrice di routing?", a: "Risolvo le equazioni di bilanciamento dei flussi (visite relative): fisso una visita di riferimento (es. y1=1) e propago. V_ij = y_i/y_j. Le visite rispetto al riferimento danno la matrice di routing equivalente." },
  { id: 62, deck: 9, q: "Verifica di correttezza durante MVA.", a: "La somma delle popolazioni deve dare N: Σ E[m_i(N)] = N. Es. con N=2: E[m1(2)]+E[m2(2)] = 2. Se non torna, c'è un errore nei calcoli." },
  { id: 63, deck: 9, q: "In MVA, posso usare R = N/X0 − Z per il tempo di risposta?", a: "Solo per sistemi interattivi (con think time Z e terminali). In una rete chiusa pura senza terminali, R_TOT = Σ R_i(N) direttamente dalle iterazioni, NON con quella formula." },

  // MAZZO 11
  { id: 64, deck: 10, q: "Cosa garantisce il teorema di Jackson / Burke?", a: "In una rete di Jackson ogni centro si comporta come un M/M/1 indipendente con il proprio λ_i. Ciò che esce da un centro entra (in forma Poisson) nel successivo. La rete è separabile: studio ogni centro in modo indipendente." },
  { id: 65, deck: 10, q: "Come scrivo le equazioni di flusso (traffico) in una rete aperta?", a: "Per ogni centro: λ_i = (arrivi esterni γ·P_si) + Σ_j λ_j·P_ji. Sistema lineare nelle λ_i; risolvo per sostituzione. Le λ_i sono i tassi di arrivo effettivi a ciascun centro." },
  { id: 66, deck: 10, q: "Tempo di risposta del singolo centro M/M/1 in rete di Jackson.", a: "E[Ts_i] = 1/(μ_i − λ_i). Vale perché ogni centro è un M/M/1 con il suo λ_i (Jackson). Richiede μ_i > λ_i (centro stabile)." },
  { id: 67, deck: 10, q: "Tempo di risposta dell'intero sistema (rete aperta).", a: "E[Tr] = Σ V_i·E[Ts_i], con V_i = λ_i/γ (visite rispetto all'arrivo esterno γ). Pesa il tempo di ogni centro per quante volte viene visitato." },
  { id: 68, deck: 10, q: "Come trovo il γ_MAX ammissibile in una rete aperta?", a: "Impongo ρ_i = λ_i/μ_i < 1 per OGNI centro. Ricavo il vincolo su γ da ciascuno e prendo il più stringente (il minimo). Il centro che satura per primo determina γ_MAX." },
  { id: 69, deck: 10, q: "Come impongo che due centri abbiano la stessa utilizzazione?", a: "Impongo ρ_i = ρ_j → λ_i/μ_i = λ_j/μ_j. Combino con le equazioni di flusso (che dipendono dalle probabilità di routing incognite) e risolvo per le probabilità P_ij." },
  { id: 70, deck: 10, q: "Come minimizzo il tempo di risposta scegliendo le probabilità di routing?", a: "Guardo quale centro 'rallenta di più' (E[Ts] maggiore) e mando meno visite a quel centro, più visite a quelli veloci. Aggiusto P_ij di conseguenza (es. V verso il centro lento ↓)." },
  { id: 71, deck: 10, q: "Calcolo delle visite rispetto all'arrivo esterno γ.", a: "V_i = λ_i/γ. Es. se λ1 = 6 e γ = 10 → V1 = 0.6. Rappresenta quante volte mediamente un job esterno passa dal centro i." },

  // MAZZO 12
  { id: 72, deck: 11, q: "Sistema chiuso M/M/1/2 (pochi job): come lo risolvo?", a: "Catena di Markov sugli stati 0,1,2. Equazioni di bilanciamento: π0·λ = π1·μ, ecc. → π_i = (λ/μ)^i·π0, normalizzo con Σπi=1. Poi numero medio = Σ i·πi e varianza = Σ i²·πi − (Σ i·πi)²." },
  { id: 73, deck: 11, q: "Come trovo la condizione di stazionarietà con parametri liberi (es. prob. p)?", a: "Scrivo le entrate λ'_i in funzione di p, impongo ρ_i = λ'_i/μ_i < 1 per ogni centro, ricavo il vincolo su p da ciascuno e prendo l'intersezione (il più stringente)." },
  { id: 74, deck: 11, q: "Media e varianza del numero di richieste da una distribuzione stazionaria.", a: "E[N] = Σ i·πi; σ²(N) = E[N²] − E[N]² = Σ i²·πi − (Σ i·πi)². Servono le πi normalizzate." },
  { id: 75, deck: 11, q: "Probabilità che il sistema sia vuoto.", a: "È π0, il primo termine della distribuzione stazionaria, ottenuto dalla normalizzazione: π0 = 1/(1 + λ/μ + 2(λ/μ)² + …) a seconda della struttura." },
  { id: 76, deck: 11, q: "Throughput di un sistema con perdite (da Markov).", a: "X = min(λ', μ) con λ' = λ·(1 − PLOSS). Il throughput effettivo tiene conto solo dei job che entrano davvero nel sistema." },

  // MAZZO 13
  { id: 77, deck: 12, q: "Cumulativa ed area dell'esponenziale che usi sempre.", a: "F(t) = 1 − e^(−μt), densità f(t) = μe^(−μt). Valori chiave: F(E[S]) = F(1/μ) = 1−e^(−1) ≈ 0.6321; coda 1−F(E[S]) ≈ 0.3679." },
  { id: 78, deck: 12, q: "Come si risolve ∫ t·μe^(−μt) dt (per il calcolo di E[S_k])?", a: "Per parti (f=t, g'=μe^(−μt)): ∫ t·μe^(−μt) dt = −t·e^(−μt) − (1/μ)e^(−μt) + C. Si valuta tra gli estremi della classe." },
  { id: 79, deck: 12, q: "Tempo di servizio condizionato per una distribuzione Uniforme(a,b).", a: "F(x) = (x−a)/(b−a). Per una classe [x_{k−1}, x_k]: E[S_k] = (1/p_k)∫ t·f(t)dt con f(t)=1/(b−a). Es. Uniforme(2,15), classe ≤8.5: p=0.5, E[S1] = 5.25 min." },
  { id: 80, deck: 12, q: "Varianza e secondo momento di una Uniforme(a,b).", a: "σ² = (b−a)²/12, media = (a+b)/2. Secondo momento E[S²] = σ² + E[S]². Serve nelle formule di attesa." },
  { id: 81, deck: 12, q: "Relazione generale tra E[S²], σ² ed E[S].", a: "E[S²] = σ²(S) + E[S]². Per l'esponenziale σ²=E[S]²=1/μ², quindi E[S²]=2·E[S]²=2/μ²." },
  { id: 82, deck: 12, q: "Perché in size-based p_k dipende da μ e non da λ?", a: "p_k è la probabilità che un job cada in una fascia di dimensione: dipende dalla cumulativa del tempo di servizio (governata da μ, la domanda media). λ è il processo d'arrivo (Poisson) e non c'entra con la dimensione del singolo job." },
].map((c, i) => ({ ...c, id: i + 1 })); // re-index sequenziale 1..85
