import { NextResponse } from 'next/server';
import { readFile, writeFile } from 'fs/promises';
import { join } from 'path';

const ENV_FILE_PATH = join(process.cwd(), '..', '.env');

export async function GET() {
  try {
    const content = await readFile(ENV_FILE_PATH, 'utf-8');
    const envVars: Record<string, string> = {};

    content.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    });

    return NextResponse.json({ envVars });
  } catch (error) {
    console.error('Failed to read .env file:', error);
    return NextResponse.json(
      { error: 'Failed to read environment variables' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { envVars } = await request.json();

    if (!envVars || typeof envVars !== 'object') {
      return NextResponse.json(
        { error: 'Invalid request body' },
        { status: 400 }
      );
    }

    // Read current .env file
    let content = '';
    try {
      content = await readFile(ENV_FILE_PATH, 'utf-8');
    } catch (error) {
      // File doesn't exist, we'll create it
    }

    // Parse existing env vars
    const lines = content.split('\n');
    const updatedLines: string[] = [];
    const processedKeys = new Set<string>();

    // Update existing lines
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        updatedLines.push(line);
        continue;
      }

      const [key] = trimmed.split('=');
      const cleanKey = key.trim();

      if (cleanKey in envVars) {
        updatedLines.push(`${cleanKey}=${envVars[cleanKey]}`);
        processedKeys.add(cleanKey);
      } else {
        updatedLines.push(line);
      }
    }

    // Add new env vars that weren't in the file
    for (const [key, value] of Object.entries(envVars)) {
      if (!processedKeys.has(key)) {
        updatedLines.push(`${key}=${value}`);
      }
    }

    // Write back to file
    await writeFile(ENV_FILE_PATH, updatedLines.join('\n'), 'utf-8');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to update .env file:', error);
    return NextResponse.json(
      { error: 'Failed to update environment variables' },
      { status: 500 }
    );
  }
}
