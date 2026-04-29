import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import { existsSync } from 'fs'

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const base64Data = formData.get('base64') as string

    // Support both file upload and base64 upload (for WebView compatibility)
    let buffer: Buffer
    let extension = '.jpg'

    if (file && file.size > 0) {
      // File upload
      const maxSize = 10 * 1024 * 1024 // 10MB limit
      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: 'File too large (max 10MB)' },
          { status: 400 }
        )
      }

      const bytes = await file.arrayBuffer()
      buffer = Buffer.from(bytes)
      extension = path.extname(file.name) || '.jpg'
    } else if (base64Data) {
      // Base64 upload (fallback for WebView)
      const base64 = base64Data.replace(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, '')
      buffer = Buffer.from(base64, 'base64')
      
      // Detect extension from data URL
      const match = base64Data.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      if (match) {
        const ext = match[1]
        extension = ext === 'jpg' || ext === 'jpeg' ? '.jpg' : `.${ext}`
      }
    } else {
      return NextResponse.json(
        { success: false, error: 'No file or base64 data provided' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const filename = `photo_${timestamp}-${random}${extension}`

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'upload')
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    return NextResponse.json({
      success: true,
      data: {
        filename,
        path: filepath
      }
    }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    )
  }
}
