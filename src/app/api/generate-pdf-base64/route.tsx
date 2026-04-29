import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReceptionFormPDF from '@/components/pdf/ReceptionFormPDF'
import { readFile } from 'fs/promises'

// Separate function to generate PDF to avoid JSX in try/catch warning
async function generatePDF(data: any) {
  return await renderToBuffer(<ReceptionFormPDF data={data} />)
}

export async function POST(request: NextRequest) {
  console.log('=== Generate PDF Base64 API called ===')

  try {
    const body = await request.json()
    const { data } = body

    console.log('Generating PDF for fiche:', data.ficheNumber)

    // Convert photo paths to base64 for PDF
    const photosArray = data.photos || []
    console.log('Processing', photosArray.length, 'photos')

    const processedPhotos = await Promise.all(
      photosArray.map(async (photo: any) => {
        if (!photo) return null

        const photoPath = typeof photo === 'string' ? photo : photo.path

        if (!photoPath) {
          return null
        }

        // If it's already a data URL, return as is
        if (photoPath.startsWith('data:')) {
          return photoPath
        }

        // Otherwise, read file and convert to base64
        try {
          const filename = photoPath.split('/').pop()
          const fullPath = `/home/z/my-project/upload/${filename}`

          const imageBuffer = await readFile(fullPath)
          const base64 = imageBuffer.toString('base64')

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
    )

    const dataWithBase64Photos = {
      ...data,
      photos: processedPhotos,
    }

    // Generate PDF
    const buffer = await generatePDF(dataWithBase64Photos)
    const base64 = buffer.toString('base64')

    console.log('PDF generated successfully as base64, size:', base64.length)

    return NextResponse.json({
      success: true,
      data: `data:application/pdf;base64,${base64}`,
      filename: `Fiche_Reception_${data.ficheNumber || 'download'}.pdf`
    })
  } catch (error) {
    console.error('=== Error generating PDF Base64 ===')
    console.error('Error:', error)

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
