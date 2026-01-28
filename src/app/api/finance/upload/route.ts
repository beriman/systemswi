import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Mock processing: In real app, we would parse Excel here using 'xlsx' library
    // and save to database.
    console.log(`Processing file: ${file.name} (${file.size} bytes)`);

    return NextResponse.json({ 
      success: true, 
      message: 'Financial report uploaded and synced successfully',
      syncPath: 'E:\\SWI\\SWI\\1. Company Profile\\financial-report.xlsx'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
