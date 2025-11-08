// src/app/api/resource/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getCollection } from '@/lib/database';
import { RESOURCE_CONFIG, ResourceType, BASE_UPLOAD_DIR } from '@/lib/resource/constants';

type RouteParams = {
  params: Promise<{
    resource: string;
  }>;
};

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { resource } = await params;

    if (!Object.keys(RESOURCE_CONFIG).includes(resource)) {
      return NextResponse.json(
        { error: 'Invalid resource type' },
        { status: 400 },
      );
    }

    const config = RESOURCE_CONFIG[resource as ResourceType];
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');

    const collection = await getCollection(config.collection);
    const data = await collection
      .find({})
      .sort({ uploadedAt: -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    const total = await collection.countDocuments();

    return NextResponse.json({
      resource,
      data,
      pagination: { limit, offset, total },
    });
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

async function ensureUploadDir(uploadDir: string) {
  if (!existsSync(uploadDir)) {
    await mkdir(uploadDir, { recursive: true });
  }
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  let filePath: string | null = null;

  try {
    const { resource } = await params;

    // Validate resource type
    if (!Object.keys(RESOURCE_CONFIG).includes(resource)) {
      return NextResponse.json(
        {
          message:
            'Invalid resource type. Supported types: video, audio, image',
        },
        { status: 400 },
      );
    }

    const resourceType = resource as ResourceType;
    const config = RESOURCE_CONFIG[resourceType];

    // Check if the request contains JSON data (URL-based save)
    const contentType = req.headers.get('content-type');
    const isJsonRequest = contentType?.includes('application/json');

    if (isJsonRequest) {
      // Handle URL-based save
      return await handleUrlBasedSave(req, resourceType, config);
    }

    // Handle file upload (existing functionality)
    const formData = await req.formData();
    const file = formData.get(resource) as File; // Use resource type as field name

    if (!file) {
      return NextResponse.json(
        { message: `No ${resource} file provided` },
        { status: 400 },
      );
    }

    // Validate file type
    if (!config.allowedTypes.includes(file.type)) {
      return NextResponse.json(
        {
          message: `Invalid file type. Only ${resourceType} files are allowed.`,
          allowedTypes: config.allowedTypes,
        },
        { status: 400 },
      );
    }

    // Validate file size
    if (file.size > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      return NextResponse.json(
        { message: `File too large. Maximum size is ${maxSizeMB}MB.` },
        { status: 400 },
      );
    }

    // Prepare file info
    const fileExtension =
      file.name.split('.').pop() || getDefaultExtension(resourceType);
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Create full upload directory path
    const uploadDir = path.join(
      process.cwd(),
      'public',
      BASE_UPLOAD_DIR,
      config.uploadDir,
    );

    // Ensure upload directory exists
    await ensureUploadDir(uploadDir);

    // Save file to disk first
    const bytes = await file.arrayBuffer();
    filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, Buffer.from(bytes));

    // Prepare file info for database
    const fileInfo = {
      filename: uniqueFilename,

      path: `${BASE_UPLOAD_DIR}/${config.uploadDir}/${uniqueFilename}`,
      url: `${BASE_UPLOAD_DIR}/${config.uploadDir}/${uniqueFilename}`,
      type: file.type,
      size: file.size,
      resourceType: resourceType,
      uploadedAt: new Date(),
      // Add resource-specific metadata
      ...getResourceSpecificMetadata(resourceType, file),
    };

    // Save to database
    const collection = await getCollection(config.collection);
    const result = await collection.insertOne(fileInfo);

    return NextResponse.json({
      message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} uploaded successfully`,
      file: { ...fileInfo, _id: result.insertedId },
    });
  } catch (error) {
    console.error('Upload error:', error);

    // Cleanup: Remove file if it was saved but database operation failed
    if (filePath && existsSync(filePath)) {
      try {
        await unlink(filePath);
        console.log('Cleaned up orphaned file:', filePath);
      } catch (unlinkError) {
        console.error('Failed to cleanup file:', unlinkError);
      }
    }

    return NextResponse.json({ message: 'Upload failed' }, { status: 500 });
  }
}

// Helper function to get default extension based on resource type
function getDefaultExtension(resourceType: ResourceType): string {
  const defaults = {
    video: 'mp4',
    audio: 'mp3',
    image: 'jpg',
  };
  return defaults[resourceType];
}

// Helper function to add resource-specific metadata
function getResourceSpecificMetadata(resourceType: ResourceType, file: File) {
  const metadata: Record<string, any> = {};

  switch (resourceType) {
    case 'video':
      // You could add video-specific metadata here
      // like duration, resolution, etc. (would need additional processing)
      metadata.duration = null;
      metadata.resolution = null;
      break;

    case 'audio':
      // Audio-specific metadata
      metadata.duration = null;
      metadata.artist = null;
      metadata.album = null;
      break;

    case 'image':
      // Image-specific metadata
      metadata.width = null;
      metadata.height = null;
      metadata.alt = file.name.split('.')[0]; // Use filename as default alt text
      break;
  }

  return metadata;
}

// New function to handle URL-based saves
async function handleUrlBasedSave(
  req: NextRequest,
  resourceType: ResourceType,
  config: any,
) {
  let filePath: string | null = null;

  try {
    const body = await req.json();
    const { videoUrl: sourceUrl, title } = body;

    if (!sourceUrl) {
      return NextResponse.json(
        { message: 'No source URL provided' },
        { status: 400 },
      );
    }

    // Fetch the file from the URL
    const response = await fetch(sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch file from URL: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Extract file extension from URL or use default
    const urlParts = new URL(sourceUrl).pathname.split('.');
    const fileExtension =
      urlParts.length > 1 ? urlParts.pop() : getDefaultExtension(resourceType);
    const uniqueFilename = `${uuidv4()}.${fileExtension}`;

    // Create full upload directory path
    const uploadDir = path.join(
      process.cwd(),
      'public/uploads',
      config.uploadDir,
    );

    // Ensure upload directory exists
    await ensureUploadDir(uploadDir);

    // Save file to disk
    filePath = path.join(uploadDir, uniqueFilename);
    await writeFile(filePath, new Uint8Array(buffer));

    // Get file size and type
    const fileSize = buffer.length;
    const mimeType =
      response.headers.get('content-type') || getDefaultMimeType(resourceType);

    // Validate file size
    if (fileSize > config.maxSize) {
      const maxSizeMB = config.maxSize / (1024 * 1024);
      throw new Error(`File too large. Maximum size is ${maxSizeMB}MB.`);
    }

    // Prepare file info for database
    const fileInfo = {
      filename: uniqueFilename,
      path: `/${config.uploadDir}/${uniqueFilename}`,
      url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${config.uploadDir}/${uniqueFilename}`,
      type: mimeType,
      size: fileSize,
      resourceType: resourceType,
      uploadedAt: new Date(),
      sourceUrl: sourceUrl, // Keep track of original source
      // Add resource-specific metadata
      ...getResourceSpecificMetadata(resourceType, {
        name: title || uniqueFilename,
        type: mimeType,
      } as File),
    };

    // Save to database
    const collection = await getCollection(config.collection);
    const result = await collection.insertOne(fileInfo);

    return NextResponse.json({
      message: `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} saved successfully`,
      file: { ...fileInfo, _id: result.insertedId },
    });
  } catch (error) {
    console.error('URL-based save error:', error);

    // Cleanup: Remove file if it was saved but database operation failed
    if (filePath && existsSync(filePath)) {
      try {
        await unlink(filePath);
        console.log('Cleaned up orphaned file:', filePath);
      } catch (unlinkError) {
        console.error('Failed to cleanup file:', unlinkError);
      }
    }

    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'Save failed' },
      { status: 500 },
    );
  }
}

// Helper function to get default MIME type based on resource type
function getDefaultMimeType(resourceType: ResourceType): string {
  const defaults = {
    video: 'video/mp4',
    audio: 'audio/mp3',
    image: 'image/jpeg',
  };
  return defaults[resourceType];
}
