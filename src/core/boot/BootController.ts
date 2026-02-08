import { SessionRepository } from '../session/SessionRepository';
import { AuthMode } from '../session/sessionTypes';
import { getDatabase } from '../../database/db';
import { Import } from 'lucide-react';
import { BootState, BootProgress } from './bootTypes';



export class BootController {
  bootState: BootState = 'INIT';
  authMode: AuthMode = 'ANONYMOUS';
  profile: any = null;

  async boot() {
    this.bootState = 'INIT';

    const db = await getDatabase();
    this.bootState = 'DB_READY';

    const session = await SessionRepository.get();
    this.bootState = 'SESSION_CHECKED';

    if (!session || !SessionRepository.isValid(session)) {
      this.authMode = 'ANONYMOUS';
    } else {
      const user = await db.users.findOne(session.uid).exec();
      if (user) {
        this.profile = user.toJSON();
        this.authMode =
          session.mode === 'offline'
            ? 'OFFLINE_AUTHENTICATED'
            : 'ONLINE_AUTHENTICATED';
      } else {
        this.authMode = 'ANONYMOUS';
      }
    }

    this.bootState = 'READY';
  }
}
