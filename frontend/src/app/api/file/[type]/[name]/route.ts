import fs from 'fs/promises';
import path from 'path';
import { NextRequest, NextResponse } from 'next/server';

const DATA_DIR = '/data/uploads/';

interface RouteParams {
  params: {
    type: string;
    name: string;
  };
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {

    const { type, name } = params;
    var imageName = name;
    // if param.file contains /data/uploads/image/, remove that part
    if (name.includes(`/data/uploads/${type}/`)) {
      imageName = name.replace(`/data/uploads/${type}/`, '');
    }
    // Build the full path to the image file
    const imagePath = path.join(DATA_DIR, type, imageName);

    // Security: prevent directory traversal
    if (!imagePath.startsWith(DATA_DIR)) {
      return NextResponse.json({ error: 'Invalid path' }, { status: 403 });
    }

    const file = await fs.readFile(imagePath);

    // Determine content type based on extension
    const ext = path.extname(imagePath).toLowerCase();
    const contentTypeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
    };

    const contentType = contentTypeMap[ext] || 'application/octet-stream';

    return new NextResponse(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Image not found' },
      { status: 404 }
    );
  }
}