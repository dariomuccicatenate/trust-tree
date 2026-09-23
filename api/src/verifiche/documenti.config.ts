import { BadRequestException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

/** I documenti non sono pubblici: vivono su un volume separato, fuori dalla webroot. */
export const CARTELLA_DOCUMENTI = process.env.DOCUMENTI_DIR ?? join(process.cwd(), 'uploads');

export const DIMENSIONE_MASSIMA_DOCUMENTO = 5 * 1024 * 1024; // 5 MB

const TIPI_AMMESSI = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

export function preparaCartella(): void {
  if (!existsSync(CARTELLA_DOCUMENTI)) {
    mkdirSync(CARTELLA_DOCUMENTI, { recursive: true });
  }
}

export const opzioniUpload = {
  storage: diskStorage({
    destination: (_richiesta, _file, callback) => {
      preparaCartella();
      callback(null, CARTELLA_DOCUMENTI);
    },
    filename: (_richiesta, file, callback) => {
      callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`);
    },
  }),
  limits: { fileSize: DIMENSIONE_MASSIMA_DOCUMENTO, files: 1 },
  fileFilter: (_richiesta: unknown, file: { mimetype: string }, callback: Function) => {
    if (!TIPI_AMMESSI.includes(file.mimetype)) {
      callback(new BadRequestException('Sono ammessi solo PDF, JPEG, PNG o WebP'), false);
      return;
    }
    callback(null, true);
  },
};
