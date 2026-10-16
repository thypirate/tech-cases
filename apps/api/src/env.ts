// Imported first in index.ts so .env is loaded before any other module reads process.env.
import dotenv from 'dotenv';

dotenv.config({ quiet: true });
