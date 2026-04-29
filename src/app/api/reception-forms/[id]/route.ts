import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const form = await db.receptionForm.findUnique({
      where: { id },
      include: {
        verifications: true,
        signatures: true,
        photos: true,
      },
    })

    if (!form) {
      return NextResponse.json(
        {
          success: false,
          error: 'Reception form not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: form,
    })
  } catch (error) {
    console.error('Error fetching reception form:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reception form',
      },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const body = await request.json()

    const {
      ficheNumber,
      project,
      company,
      client,
      bureauEtude,
      block,
      level,
      location,
      receptionDate,
      receptionTime,
      weather,
      elementType,
      referencePlans,
      borderau,
      specifications,
      planNumber,
      planIndex,
      observations,
      followUpAction,
      reservationDeadline,
      reservationResponsible,
      status,
      verifications,
      photos,
      signatures,
    } = body

    // Check if ficheNumber already exists (if changed)
    if (ficheNumber) {
      const existing = await db.receptionForm.findFirst({
        where: {
          ficheNumber,
          NOT: { id },
        },
      })
      if (existing) {
        return NextResponse.json(
          {
            success: false,
            error: 'Ce numéro de fiche existe déjà',
          },
          { status: 400 }
        )
      }
    }

    // Update the reception form
    const form = await db.receptionForm.update({
      where: { id },
      data: {
        ficheNumber,
        project,
        company,
        client,
        bureauEtude,
        block,
        level,
        location,
        receptionDate,
        receptionTime,
        weather,
        elementType,
        referencePlans,
        borderau,
        specifications,
        planNumber,
        planIndex,
        observations,
        followUpAction,
        reservationDeadline,
        reservationResponsible,
        status,
      },
      include: {
        verifications: true,
        signatures: true,
        photos: true,
      },
    })

    // Update related data if provided
    if (verifications) {
      // Delete existing verifications
      await db.verificationItem.deleteMany({
        where: { receptionFormId: id },
      })
      // Create new verifications
      await db.verificationItem.createMany({
        data: verifications.map((v: any) => ({
          receptionFormId: id,
          criteria: v.criteria,
          isCompliant: v.isCompliant,
          isNonCompliant: v.isNonCompliant,
          isNotApplicable: v.isNotApplicable,
          observations: v.observations,
        })),
      })
    }

    if (signatures) {
      // Delete existing signatures
      await db.signature.deleteMany({
        where: { receptionFormId: id },
      })
      // Create new signatures
      await db.signature.createMany({
        data: signatures.map((s: any) => ({
          receptionFormId: id,
          role: s.role,
          name: s.name,
          function: s.function,
          date: s.date,
          time: s.time,
        })),
      })
    }

    if (photos) {
      // Delete existing photos
      await db.photo.deleteMany({
        where: { receptionFormId: id },
      })
      // Create new photos
      await db.photo.createMany({
        data: photos.map((p: string, index: number) => ({
          receptionFormId: id,
          path: p,
          index: index + 1,
        })),
      })
    }

    // Fetch updated form with all relations
    const updatedForm = await db.receptionForm.findUnique({
      where: { id },
      include: {
        verifications: true,
        signatures: true,
        photos: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: updatedForm,
    })
  } catch (error) {
    console.error('Error updating reception form:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update reception form',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    await db.receptionForm.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: 'Reception form deleted successfully',
    })
  } catch (error) {
    console.error('Error deleting reception form:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete reception form',
      },
      { status: 500 }
    )
  }
}
