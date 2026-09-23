import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CATEGORIE_SERVIZIO,
  COMPLETAMENTO,
  FASCE_IMPORTO,
  GIUDIZI,
  INTENZIONI,
  LIVELLI_VERIFICA,
  MAX_COMMENTO,
  MAX_DESCRIZIONE_LAVORO,
  MAX_MOTIVI,
  METODI_VERIFICA,
  MOTIVI,
  PERIODI_UTILIZZO,
  PROBLEMI_SUCCESSIVI,
  PUNTUALITA,
  RISPETTO_PREZZO,
} from '../common/questionario';

/**
 * Struttura del "Questionario di referenza 1.0": sezioni, numerazione e opzioni
 * corrispondono al documento. Serve al client per costruire il form senza duplicare
 * i valori ammessi.
 */
const QUESTIONARIO = {
  versione: '1.0',
  titolo: 'Questionario di referenza 1.0',
  note: [
    'Il questionario è progettato per essere completato in meno di due minuti.',
    'Le risposte non applicabili sono escluse dal calcolo, senza penalizzazioni.',
    'Solo chi ha utilizzato personalmente il professionista può rilasciare una referenza.',
  ],
  sezioni: [
    {
      codice: 'A',
      titolo: 'Identificazione del servizio',
      domande: [
        {
          numero: 1,
          campo: 'utilizzoPersonale',
          testo: 'Hai utilizzato personalmente questo professionista o fornitore?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: [
            { valore: 'si', etichetta: 'Sì', nota: 'prosegue il questionario' },
            {
              valore: 'no',
              etichetta: 'No',
              nota: 'può essere registrata soltanto una segnalazione, senza valore reputazionale',
            },
          ],
        },
        {
          numero: 2,
          campo: 'categoriaServizio',
          testo: 'Quale servizio ha svolto?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: CATEGORIE_SERVIZIO,
          nota: 'Selezione della categoria da tassonomia controllata.',
          campoAggiuntivo: {
            campo: 'descrizioneLavoro',
            testo: 'Breve descrizione del lavoro',
            tipo: 'testo',
            obbligatoria: false,
            lunghezzaMassima: MAX_DESCRIZIONE_LAVORO,
          },
        },
        {
          numero: 3,
          campo: 'periodoUtilizzo',
          testo: 'Quando hai utilizzato il professionista?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: PERIODI_UTILIZZO,
        },
        {
          numero: 4,
          campo: 'fasciaImporto',
          testo: "Qual è stata la fascia indicativa dell'importo del lavoro?",
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: FASCE_IMPORTO,
        },
      ],
    },
    {
      codice: 'B',
      titolo: 'Valutazione oggettiva',
      domande: [
        {
          numero: 5,
          campo: 'puntualita',
          testo: 'Il professionista si è presentato nei tempi concordati?',
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: PUNTUALITA,
        },
        {
          numero: 6,
          campo: 'rispettoPrezzo',
          testo: 'Il prezzo finale ha rispettato quanto preventivato o concordato?',
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: RISPETTO_PREZZO,
        },
        {
          numero: 7,
          campo: 'completamento',
          testo: 'Il lavoro è stato completato correttamente?',
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: COMPLETAMENTO,
        },
        {
          numero: 8,
          campo: 'qualita',
          testo: 'Come valuti la qualità del lavoro?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: GIUDIZI,
        },
        {
          numero: 9,
          campo: 'correttezza',
          testo: 'Come valuti correttezza e professionalità?',
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: GIUDIZI,
        },
      ],
    },
    {
      codice: 'C',
      titolo: 'Domande determinanti',
      domande: [
        {
          numero: 10,
          campo: 'richiamerebbe',
          testo:
            'Se avessi nuovamente bisogno dello stesso servizio, richiameresti questo professionista?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: INTENZIONI,
        },
        {
          numero: 11,
          campo: 'consiglierebbe',
          testo: 'Lo consiglieresti personalmente a un amico o familiare?',
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: INTENZIONI,
          nota:
            'È il principale indicatore del sistema, perché implica una responsabilità personale ' +
            'maggiore rispetto all’assegnazione di un voto generico.',
        },
        {
          numero: 12,
          campo: 'problemiSuccessivi',
          testo: "Dopo l'intervento si sono verificati problemi riconducibili al lavoro?",
          tipo: 'scelta_singola',
          obbligatoria: false,
          opzioni: PROBLEMI_SUCCESSIVI,
        },
      ],
    },
    {
      codice: 'D',
      titolo: 'Referenza qualitativa',
      domande: [
        {
          numero: 13,
          campo: 'motivi',
          testo: 'Quali sono i principali motivi per cui lo consiglieresti?',
          tipo: 'scelta_multipla',
          obbligatoria: false,
          risposteMassime: MAX_MOTIVI,
          opzioni: MOTIVI,
        },
        {
          numero: 14,
          campo: 'commento',
          testo: 'Vuoi aggiungere una informazione utile agli altri utenti?',
          tipo: 'testo',
          obbligatoria: false,
          lunghezzaMassima: MAX_COMMENTO,
          nota:
            'Il campo è sottoposto a moderazione e non deve contenere dati personali non necessari.',
        },
      ],
    },
    {
      codice: 'E',
      titolo: "Verifica dell'esperienza",
      domande: [
        {
          numero: 15,
          campo: 'metodoVerifica',
          testo: "Puoi confermare l'effettivo utilizzo del professionista?",
          tipo: 'scelta_singola',
          obbligatoria: true,
          opzioni: Object.entries(METODI_VERIFICA).map(([valore, livello]) => ({
            valore,
            livello,
          })),
          nota:
            'I documenti caricati non sono pubblicati: vengono conservati solo per il tempo ' +
            'necessario alla verifica.',
        },
      ],
    },
  ],
  livelliVerifica: [
    {
      codice: 'V0',
      nome: 'Segnalazione',
      definizione: 'Nessuna esperienza personale dichiarata',
      effetto: 'Non genera reputazione',
    },
    {
      codice: 'V1',
      nome: 'Referenza',
      definizione: 'Utente identificato che dichiara esperienza personale',
      effetto: 'Coefficiente 0,70',
    },
    {
      codice: 'V2',
      nome: 'Referenza verificata',
      definizione: 'Conferma reciproca o prova documentale',
      effetto: 'Coefficiente 0,90',
    },
    {
      codice: 'V3',
      nome: 'Transazione verificata',
      definizione: 'Richiesta e intervento transitati nella piattaforma',
      effetto: 'Coefficiente 1,00',
    },
  ],
  livelliAmmessi: LIVELLI_VERIFICA,
} as const;

@ApiTags('questionario')
@Controller('questionario')
export class QuestionarioController {
  @Get()
  @ApiOperation({
    summary: 'Struttura del questionario di referenza 1.0 e valori ammessi per ogni campo',
  })
  struttura() {
    return QUESTIONARIO;
  }
}
