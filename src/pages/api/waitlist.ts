import type { APIRoute } from 'astro';
import { promises as fs } from 'node:fs';
import path from 'node:path';

type WaitlistEntry = {
  email: string;
  createdAt: string;
};

type WaitlistStorage = {
  signUp: (email: string) => Promise<WaitlistEntry[]>;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const EARLY_BIRD_LIMIT = 100;
const EARLY_BIRD_TAG = 'earlybird-49';

declare global {
  var _asynckeelWaitlistStore: WaitlistEntry[] | undefined;
}

const getStorage = (): WaitlistStorage => {
  const filePath = process.env.WAITLIST_STORAGE_FILE;

  if (filePath) {
    const resolvedPath = path.resolve(filePath);
    return {
      async signUp(email) {
        const records = await readFileRecords(resolvedPath);
        const normalizedEmail = email.toLowerCase();
        const existing = records.find((entry) => entry.email === normalizedEmail);

        if (!existing) {
          records.push({ email: normalizedEmail, createdAt: new Date().toISOString() });
          await fs.mkdir(path.dirname(resolvedPath), { recursive: true });
          await fs.writeFile(resolvedPath, JSON.stringify(records, null, 2), 'utf8');
        }

        return records;
      },
    };
  }

  if (!globalThis._asynckeelWaitlistStore) {
    globalThis._asynckeelWaitlistStore = [];
  }

  return {
    async signUp(email) {
      const normalizedEmail = email.toLowerCase();
      const records = globalThis._asynckeelWaitlistStore!;
      const exists = records.some((entry) => entry.email === normalizedEmail);

      if (!exists) {
        records.push({ email: normalizedEmail, createdAt: new Date().toISOString() });
      }

      return records;
    },
  };
};

const readFileRecords = async (resolvedPath: string): Promise<WaitlistEntry[]> => {
  try {
    const file = await fs.readFile(resolvedPath, 'utf8');
    const parsed = JSON.parse(file);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  });

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  let payload: { email?: string };

  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, error: 'Invalid JSON payload' }, 400);
  }

  const normalizedEmail = payload.email?.trim().toLowerCase();
  if (!normalizedEmail || !EMAIL_REGEX.test(normalizedEmail)) {
    return json({ ok: false, error: 'Invalid email address' }, 400);
  }

  const storage = getStorage();
  const records = await storage.signUp(normalizedEmail);
  const position = records.findIndex((entry) => entry.email === normalizedEmail) + 1;
  const earlyBird = position > 0 && position <= EARLY_BIRD_LIMIT;

  return json({
    ok: true,
    position,
    earlyBird,
    tag: earlyBird ? EARLY_BIRD_TAG : null,
  });
};

export const GET: APIRoute = async () => json({ ok: true });
