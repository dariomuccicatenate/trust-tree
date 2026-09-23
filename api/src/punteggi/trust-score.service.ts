import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Recensione } from '../recensioni/recensione.entity';
import {
  COEFFICIENTE_RECENZA,
  COEFFICIENTE_VERIFICA,
  CONCENTRAZIONE_MASSIMA,
  ComponenteTS,
  FINESTRA_CONCENTRAZIONE_GIORNI,
  PENALITA_INDIPENDENZA,
  PESI_TRUST_SCORE,
  SOGLIA_ESPERIENZE_VALIDE,
  SOGLIA_REFERENTI_DISTINTI,
  VALORI_COMPLETAMENTO,
  VALORI_GIUDIZIO,
  VALORI_INTENZIONE,
  VALORI_PREZZO,
  VALORI_PROBLEMI,
  VALORI_PUNTUALITA,
  solidita,
  valoreV,
} from './parametri';

export interface RisultatoTrustScore {
  professionistaId: string;
  pubblicato: boolean;
  punteggio: number | null;
  solidita: string;
  esperienzeValide: number;
  referentiDistinti: number;
  fontiConcentrate: boolean;
  componenti: Partial<Record<ComponenteTS, number>>;
  pesiApplicati: Partial<Record<ComponenteTS, number>>;
}

/**
 * Trust Score 1.0.
 *
 *   TS = 0,25C + 0,20R + 0,15Q + 0,15E + 0,10P + 0,05A + 0,05PR + 0,05V
 *
 * dove ogni componente X e' la media ponderata delle risposte valide
 *
 *   X = Σ (valore rispostaᵢ × peso referenzaᵢ) / Σ peso referenzaᵢ
 *
 * e il peso della singola referenza e'
 *
 *   peso = coefficiente verifica × coefficiente recenza × affidabilita' del referente
 *
 * Le componenti non valutabili sono escluse e i pesi residui riproporzionati al 100%.
 */
@Injectable()
export class TrustScoreService {
  constructor(
    @InjectRepository(Recensione)
    private readonly recensioni: Repository<Recensione>,
  ) {}

  async perProfessionista(professionistaId: string): Promise<RisultatoTrustScore> {
    const recensioni = await this.recensioni.find({
      where: { professionistaId },
      relations: { utente: true },
    });
    return this.calcola(professionistaId, recensioni);
  }

  /** Carica in un colpo solo le recensioni di piu' professionisti (evita le query in ciclo). */
  async recensioniDi(professionistiIds: string[]): Promise<Map<string, Recensione[]>> {
    const mappa = new Map<string, Recensione[]>();
    if (professionistiIds.length === 0) {
      return mappa;
    }

    const recensioni = await this.recensioni.find({
      where: { professionistaId: In(professionistiIds) },
      relations: { utente: true },
    });

    for (const recensione of recensioni) {
      const elenco = mappa.get(recensione.professionistaId) ?? [];
      elenco.push(recensione);
      mappa.set(recensione.professionistaId, elenco);
    }

    return mappa;
  }

  /** Una referenza entra nel calcolo solo se pubblicata e con esperienza personale (V1-V3). */
  esperienzeValide(recensioni: Recensione[]): Recensione[] {
    return recensioni.filter((r) => r.stato === 'pubblicata' && r.livelloVerifica !== 'V0');
  }

  /** peso = coefficiente verifica × coefficiente recenza × affidabilita' del referente. */
  pesoReferenza(recensione: Recensione): number {
    const verifica = COEFFICIENTE_VERIFICA[recensione.livelloVerifica] ?? 0;
    const recenza = COEFFICIENTE_RECENZA[recensione.periodoUtilizzo] ?? 0.7;
    const affidabilita = 1.0; // versione 1.0: 1,00 per gli account regolari
    return verifica * recenza * affidabilita;
  }

  calcola(professionistaId: string, recensioni: Recensione[]): RisultatoTrustScore {
    const valide = this.esperienzeValide(recensioni);
    const referenti = new Set(valide.map((r) => r.utenteId));
    const numero = valide.length;

    if (numero < SOGLIA_ESPERIENZE_VALIDE || referenti.size < SOGLIA_REFERENTI_DISTINTI) {
      return {
        professionistaId,
        pubblicato: false,
        punteggio: null,
        solidita: 'Reputazione in costruzione',
        esperienzeValide: numero,
        referentiDistinti: referenti.size,
        fontiConcentrate: false,
        componenti: {},
        pesiApplicati: {},
      };
    }

    const pesate = valide.map((r) => ({ r, peso: this.pesoReferenza(r) }));
    const concentrate = this.fontiConcentrate(valide);

    const componenti: Partial<Record<ComponenteTS, number>> = {};
    const assegna = (chiave: ComponenteTS, valore: number | null) => {
      if (valore !== null) componenti[chiave] = valore;
    };

    assegna(
      'C',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_INTENZIONE, r.consiglierebbe), peso]),
      ),
    );
    assegna(
      'R',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_INTENZIONE, r.richiamerebbe), peso]),
      ),
    );
    assegna(
      'Q',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_GIUDIZIO, r.qualita), peso]),
      ),
    );
    assegna('E', this.mediaPonderata(pesate.map(({ r, peso }) => [this.valoreEsito(r), peso])));
    assegna(
      'P',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_PREZZO, r.rispettoPrezzo), peso]),
      ),
    );
    assegna(
      'A',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_PUNTUALITA, r.puntualita), peso]),
      ),
    );
    assegna(
      'PR',
      this.mediaPonderata(
        pesate.map(({ r, peso }) => [this.valore(VALORI_GIUDIZIO, r.correttezza), peso]),
      ),
    );

    // V: numerosita' delle esperienze, con il correttivo di indipendenza.
    componenti.V = concentrate
      ? Math.max(0, valoreV(numero) - PENALITA_INDIPENDENZA)
      : valoreV(numero);

    const pesiApplicati: Partial<Record<ComponenteTS, number>> = {};
    let pesoTotale = 0;
    let somma = 0;

    (Object.keys(PESI_TRUST_SCORE) as ComponenteTS[]).forEach((chiave) => {
      const valore = componenti[chiave];
      if (valore !== undefined) {
        pesoTotale += PESI_TRUST_SCORE[chiave];
        somma += PESI_TRUST_SCORE[chiave] * valore;
      }
    });

    // Riproporzionamento dei pesi residui al 100%.
    (Object.keys(componenti) as ComponenteTS[]).forEach((chiave) => {
      pesiApplicati[chiave] = pesoTotale > 0 ? PESI_TRUST_SCORE[chiave] / pesoTotale : 0;
    });

    return {
      professionistaId,
      pubblicato: true,
      punteggio: pesoTotale > 0 ? Math.round(somma / pesoTotale) : 0,
      solidita: solidita(numero),
      esperienzeValide: numero,
      referentiDistinti: referenti.size,
      fontiConcentrate: concentrate,
      componenti,
      pesiApplicati,
    };
  }

  private mediaPonderata(valori: Array<[number | null, number]>): number | null {
    let numeratore = 0;
    let denominatore = 0;

    for (const [valore, peso] of valori) {
      if (valore !== null && valore !== undefined) {
        numeratore += valore * peso;
        denominatore += peso;
      }
    }

    return denominatore > 0 ? numeratore / denominatore : null;
  }

  private valore(mappa: Record<string, number>, risposta: string | null): number | null {
    if (!risposta) return null;
    const valore = mappa[risposta];
    return valore === undefined ? null : valore;
  }

  /** Componente E: media tra completamento e problemi successivi, sulle sole risposte valutabili. */
  private valoreEsito(recensione: Recensione): number | null {
    const valutabili = [
      this.valore(VALORI_COMPLETAMENTO, recensione.completamento),
      this.valore(VALORI_PROBLEMI, recensione.problemiSuccessivi),
    ].filter((v): v is number => v !== null);

    if (valutabili.length === 0) return null;
    return valutabili.reduce((somma, v) => somma + v, 0) / valutabili.length;
  }

  /**
   * Correttivo di indipendenza: oltre il 60% delle referenze dalla stessa comunita'
   * (qui il condominio del referente) o dentro una finestra di 30 giorni.
   */
  private fontiConcentrate(recensioni: Recensione[]): boolean {
    const totale = recensioni.length;
    if (totale === 0) return false;

    const perCondominio = new Map<string, number>();
    for (const r of recensioni) {
      const condominio = r.utente?.condominio;
      if (condominio) {
        perCondominio.set(condominio, (perCondominio.get(condominio) ?? 0) + 1);
      }
    }
    const massimoCondominio = Math.max(0, ...perCondominio.values());

    const finestra = FINESTRA_CONCENTRAZIONE_GIORNI * 24 * 60 * 60 * 1000;
    const date = recensioni.map((r) => new Date(r.creatoIl).getTime()).sort((a, b) => a - b);
    let massimaFinestra = 0;
    let inizio = 0;
    for (let i = 0; i < date.length; i++) {
      while (date[i] - date[inizio] > finestra) {
        inizio++;
      }
      massimaFinestra = Math.max(massimaFinestra, i - inizio + 1);
    }

    return (
      massimoCondominio / totale > CONCENTRAZIONE_MASSIMA ||
      (totale > 2 && massimaFinestra / totale > CONCENTRAZIONE_MASSIMA)
    );
  }
}
