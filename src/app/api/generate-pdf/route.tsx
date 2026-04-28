import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReceptionFormPDF from '@/components/pdf/ReceptionFormPDF'
import { readFile } from 'fs/promises'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { data } = body

    console.log('Generating PDF for fiche:', data.ficheNumber)
    console.log('Photos in data:', data.photos)

    // Convert photo paths to base64 for PDF
    const dataWithBase64Photos = {
      ...data,
      photos: await Promise.all(
        (data.photos || []).map(async (photo: any) => {
          if (!photo) return null
          
          // Handle both string paths and object with path property
          const photoPath = typeof photo === 'string' ? photo : photo.path
          
          if (!photoPath) return null
          
          // If it's already a data URL, return as is
          if (photoPath.startsWith('data:')) {
            return photoPath
          }
          
          // Otherwise, read the file and convert to base64
          try {
            // Extract filename from path like "/api/files/photo-name-123456789.jpg"
            const filename = photoPath.split('/').pop()
            const fullPath = `/home/z/my-project/upload/${filename}`
            
            const imageBuffer = await readFile(fullPath)
            const base64 = imageBuffer.toString('base64')
            
            // Determine mime type
            const ext = filename?.split('.').pop()?.toLowerCase()
            const mimeTypes: Record<string, string> = {
              jpg: 'image/jpeg',
              jpeg: 'image/jpeg',
              png: 'image/png',
              gif: 'image/gif',
              webp: 'image/webp',
            }
            const mimeType = mimeTypes[ext || ''] || 'image/jpeg'
            
            return `data:${mimeType};base64,${base64}`
          } catch (error) {
            console.error('Error reading photo file:', photoPath, error)
            return null
          }
        })
      ),
    }

    // Generate PDF
    const buffer = await renderToBuffer(
      <ReceptionFormPDF data={dataWithBase64Photos} />
    )

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Fiche_Reception_${data.ficheNumber || 'download'}.pdf"`,
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
