// For App Router (alternative)
// app/api/viewvideo/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const filename = searchParams.get('filename');

  if (!filename) {
    return NextResponse.json({ error: 'Filename parameter is required' }, { status: 400 });
  }

  try {
    // Look for video in public directory
    const videoPath = path.join(process.cwd(), 'public/video', filename);

    if (!fs.existsSync(videoPath)) {
      return NextResponse.json({ error: 'Video file not found' }, { status: 404 });
    }

    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;

      const fileStream = fs.createReadStream(videoPath, { start, end });

      return new Response(fileStream as any, {
        status: 206,
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': 'video/mp4',
        },
      });
    } else {
      const fileStream = fs.createReadStream(videoPath);

      return new Response(fileStream as any, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': 'video/mp4',
        },
      });
    }
  } catch (error) {
    console.error('Error serving video:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}