import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import path from 'path';
import fs from 'fs';

/**
 * GET /api/mobile/download
 * Download latest MajaCraft mobile APK
 */
export async function GET(request: NextRequest) {
  try {
    // Path to APK file in public directory
    const apkPath = path.join(process.cwd(), 'public', 'downloads', 'majacraft.apk');
    
    // Check if file exists
    if (!fs.existsSync(apkPath)) {
      return NextResponse.json(
        { success: false, error: 'APK file not found' },
        { status: 404 }
      );
    }

    // Get file stats
    const stats = fs.statSync(apkPath);
    const fileBuffer = fs.readFileSync(apkPath);

    // Return file with proper headers for download
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': `attachment; filename="MajaCraft-v1.0.0.apk"`,
        'Content-Length': stats.size.toString(),
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error: any) {
    console.error('Error downloading APK:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to download APK' },
      { status: 500 }
    );
  }
}
