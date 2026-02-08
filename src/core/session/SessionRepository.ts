import { getDatabase } from '../../database/db';
import { LocalSession } from './sessionTypes';

const SESSION_ID = 'local-session';

export class SessionRepository {
  static async get(): Promise<LocalSession | null> {
    const db = await getDatabase();
    const doc = await db.session.findOne(SESSION_ID).exec();
    return doc ? (doc.toJSON() as LocalSession) : null;
  }

  static async save(session: LocalSession) {
    const db = await getDatabase();
    await db.session.upsert({ id: SESSION_ID, ...session });
  }

  static async clear() {
    const db = await getDatabase();
    const doc = await db.session.findOne(SESSION_ID).exec();
    if (doc) await doc.remove();
  }

  static isValid(session: LocalSession): boolean {
    if (!session.uid) return false;
    if (!session.integrityHash) return false;
    return true;
  }
}
