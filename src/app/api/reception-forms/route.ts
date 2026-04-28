import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const forms = await db.receptionForm.findMany({
      include: {
        verifications: true,
        signatures: true,
        photos: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json({
      success: true,
      data: forms,
    })
  } catch (error) {
    console.error('Error fetching reception forms:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch reception forms',
      },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
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
      verifications,
      photos,
      signatures,
    } = body

    // Check if ficheNumber already exists
    if (ficheNumber) {
      const existing = await db.receptionForm.findUnique({
        where: { ficheNumber },
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

    // Create the reception form with all related data
    const form = await db.receptionForm.create({
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
        status: 'soumis',
        verifications: {
          create: verifications?.map((v: any) => ({
            criteria: v.criteria,
            isCompliant: v.isCompliant,
            isNonCompliant: v.isNonCompliant,
            isNotApplicable: v.isNotApplicable,
            observations: v.observations,
          })) || [],
        },
        signatures: {
          create: signatures?.map((s: any) => ({
            role: s.role,
            name: s.name,
            function: s.function,
            date: s.date,
            time: s.time,
          })) || [],
        },
        photos: {
          create: photos?.map((p: string, index: number) => ({
            path: p,
            index: index + 1,
          })) || [],
        },
      },
      include: {
        verifications: true,
        signatures: true,
        photos: true,
      },
    })

    return NextResponse.json({
      success: true,
      data: form,
    })
  } catch (error) {
    console.error('Error creating reception form:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create reception form',
      },
      { status: 500 }
    )
  }
}
