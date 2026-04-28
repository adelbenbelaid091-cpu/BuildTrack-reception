import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json(
        {
          success: false,
          error: 'No file provided',
        },
        { status: 400 }
      )
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique filename
    const timestamp = Date.now()
    const originalName = file.name
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const filename = `${baseName}-${timestamp}${ext}`

    // Ensure upload directory exists
    const uploadDir = '/home/z/my-project/upload'
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Write file to upload directory
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    // Return the file path (relative to the server)
    return NextResponse.json({
      success: true,
      data: {
        filename,
        path: `/upload/${filename}`,
        size: file.size,
        type: file.type,
      },
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to upload file',
      },
      { status: 500 }
    )
  }
}
