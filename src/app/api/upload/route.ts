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
  console.log('=== Upload API called ===')
  
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const base64Data = formData.get('base64') as string

    console.log('File:', file?.name, 'Size:', file?.size)
    console.log('Base64 data present:', !!base64Data)

    // Support both file upload and base64 upload (for WebView compatibility)
    let buffer: Buffer
    let extension = '.jpg'

    if (file && file.size > 0) {
      // File upload
      console.log('Processing as file upload')
      const maxSize = 10 * 1024 * 1024 // 10MB limit
      if (file.size > maxSize) {
        console.log('File too large:', file.size)
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
      console.log('Processing as base64 upload')
      const base64 = base64Data.replace(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/, '')
      buffer = Buffer.from(base64, 'base64')
      
      // Detect extension from data URL
      const match = base64Data.match(/^data:image\/(png|jpg|jpeg|gif|webp);base64,/)
      if (match) {
        const ext = match[1]
        extension = ext === 'jpg' || ext === 'jpeg' ? '.jpg' : `.${ext}`
      }
    } else {
      console.log('No file or base64 data provided')
      return NextResponse.json(
        { success: false, error: 'No file or base64 data provided' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const random = Math.random().toString(36).substring(7)
    const filename = `photo_${timestamp}-${random}${extension}`

    console.log('Generated filename:', filename)
    console.log('File size:', buffer.length, 'bytes')

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'upload')
    if (!existsSync(uploadDir)) {
      console.log('Creating upload directory:', uploadDir)
      await mkdir(uploadDir, { recursive: true })
    }

    // Save file
    const filepath = path.join(uploadDir, filename)
    await writeFile(filepath, buffer)

    console.log('File saved successfully:', filepath)

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
    console.error('=== Upload Error ===')
    console.error('Error:', error)
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
