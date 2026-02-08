import { getDatabase } from './db';
import { getDatabaseSafely } from '../database/databaseGuardian';

export const getOfflineUserByEmailAndPin = async (
  email: string,
  pin: string
) => {
  const db = await getDatabaseSafely();

  const users = await db.users
    .find({
      selector: { email }
    })
    .exec();

  if (!users.length) return null;

  const user = users[0].toJSON();

  if (user.pin !== pin) return null;

  return {
    profile: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    }
  };
};
