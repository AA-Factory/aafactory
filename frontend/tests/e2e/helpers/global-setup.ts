// global-setup.ts
import { cleanAllDirectories } from '@/lib/fileUtils';
import { clearCollection, closeDatabaseConnection } from '../helpers/db-helpers';

async function globalSetup() {
  await clearCollection('avatars');
  await cleanAllDirectories();
  await closeDatabaseConnection();
}

export default globalSetup;