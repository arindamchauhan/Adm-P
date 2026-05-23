import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { verifyToken } from '@/lib/auth';

export const runtime = 'nodejs';

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
]);

function getAuthToken(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) return null;
  return authHeader.replace('Bearer ', '');
}

function isAdminRequest(request: NextRequest) {
  const token = getAuthToken(request);
  if (!token) return false;
  const decoded = verifyToken(token);
  return Boolean(decoded && decoded.role === 'admin');
}

function extensionFromMimeType(mimeType: string) {
  if (mimeType === 'image/jpeg' || mimeType === 'image/jpg') return 'jpg';
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/gif') return 'gif';
  return 'bin';
}

const PUBLIC_UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'products');

export async function POST(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    if (!ALLOWED_MIME_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type. Use JPG, PNG, WEBP, or GIF.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 5MB.' },
        { status: 400 }
      );
    }

    await fs.mkdir(PUBLIC_UPLOAD_DIR, { recursive: true });

    const fileExtension = extensionFromMimeType(file.type);
    const fileName = `${Date.now()}-${randomUUID()}.${fileExtension}`;
    const filePath = path.join(PUBLIC_UPLOAD_DIR, fileName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    await fs.writeFile(filePath, buffer);

    const publicUrl = `/uploads/products/${fileName}`;
    return NextResponse.json({ url: publicUrl }, { status: 201 });
  } catch (error) {
    console.error('Product image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    if (!isAdminRequest(request)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { url } = await request.json();
    if (typeof url !== 'string' || !url.startsWith('/uploads/products/')) {
      return NextResponse.json({ error: 'Invalid image url' }, { status: 400 });
    }

    const fileName = path.basename(url);
    const filePath = path.join(PUBLIC_UPLOAD_DIR, fileName);

    if (!filePath.startsWith(PUBLIC_UPLOAD_DIR)) {
      return NextResponse.json({ error: 'Invalid file path' }, { status: 400 });
    }

    try {
      await fs.unlink(filePath);
    } catch {
      // Ignore if file is already missing.
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Product image delete error:', error);
    return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 });
  }
}
