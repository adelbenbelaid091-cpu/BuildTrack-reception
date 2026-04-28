import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer } from '@react-pdf/renderer'
import ReceptionFormPDF from '@/components/pdf/ReceptionFormPDF'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { data } = body

    if (!data) {
      return NextResponse.json(
        {
          success: false,
          error: 'No data provided',
        },
        { status: 400 }
      )
    }

    // Generate PDF
    const buffer = await renderToBuffer(
      <ReceptionFormPDF data={data} />
    )

    // Create filename with fiche number and date
    const filename = `Fiche_Reception_${data.ficheNumber || Date.now()}.pdf`

    // Return PDF as downloadable file
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error generating PDF:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to generate PDF',
      },
      { status: 500 }
    )
  }
}
