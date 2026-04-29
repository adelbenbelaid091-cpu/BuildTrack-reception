import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReceptionFormPDF from '@/components/pdf/ReceptionFormPDF'
import { readFile } from 'fs/promises'

// Separate function to generate PDF to avoid JSX in try/catch warning
async function generatePDF(data: any) {
  return await renderToBuffer(<ReceptionFormPDF data={data} />)
}

export async function POST(request: NextRequest) {
  console.log('=== Generate PDF API called ===')

  try {
    const body = await request.json()
    const { data } = body

    console.log('Generating PDF for fiche:', data.ficheNumber)
    console.log('Photos in data:', data.photos)

    // Convert photo paths to base64 for PDF
    const photosArray = data.photos || []
    console.log('Processing', photosArray.length, 'photos')

    const processedPhotos = await Promise.all(
      photosArray.map(async (photo: any) => {
        if (!photo) return null

        // Handle both string paths and object with path property
        const photoPath = typeof photo === 'string' ? photo : photo.path

        if (!photoPath) {
          console.log('Skipping photo with no path')
          return null
        }

        // If it's already a data URL, return as is
        if (photoPath.startsWith('data:')) {
          console.log('Photo already in base64 format')
          return photoPath
        }

        // Otherwise, read the file and convert to base64
        try {
          // Extract filename from path like "/api/files/photo-name-123456789.jpg"
          const filename = photoPath.split('/').pop()
          const fullPath = `/home/z/my-project/upload/${filename}`

          console.log('Reading photo from:', fullPath)

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

          console.log('Converted photo to base64:', mimeType, 'size:', base64.length)

          return `data:${mimeType};base64,${base64}`
        } catch (error) {
          console.error('Error reading photo file:', photoPath, error)
          return null
        }
      })
    )

    const dataWithBase64Photos = {
      ...data,
      photos: processedPhotos,
    }

    console.log('Generating PDF with', processedPhotos.filter(p => p !== null).length, 'photos')

    // Generate PDF
    const buffer = await generatePDF(dataWithBase64Photos)

    console.log('PDF generated successfully, size:', buffer.length, 'bytes')

    // Create filename with proper encoding
    const filename = `Fiche_Reception_${data.ficheNumber || 'download'}.pdf`
    const encodedFilename = encodeURIComponent(filename)

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"; filename*=UTF-8''${encodedFilename}`,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    })
  } catch (error) {
    console.error('=== Error generating PDF ===')
    console.error('Error:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack')

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
