import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { generateCertificate, generateBulkCertificates } from '@/lib/certificate';

export async function POST(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const body = await req.json();
    const { userId, type } = body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const hackathon = await prisma.hackathon.findUnique({
      where: { id: params.hackathonId },
    });

    if (!hackathon) {
      return NextResponse.json(
        { error: 'Hackathon not found' },
        { status: 404 }
      );
    }

    // Check if certificate already exists
    const existingCert = await prisma.certificate.findFirst({
      where: {
        hackathonId: params.hackathonId,
        userId,
        type,
      },
    });

    if (existingCert) {
      return NextResponse.json(
        { error: 'Certificate already generated' },
        { status: 400 }
      );
    }

    const certificateUrl = await generateCertificate(
      user.name,
      type,
      hackathon.title,
      new Date()
    );

    const certificate = await prisma.certificate.create({
      data: {
        hackathonId: params.hackathonId,
        userId,
        type,
        title: `${type} Certificate - ${hackathon.title}`,
        certificateUrl,
      },
    });

    return NextResponse.json(
      {
        message: 'Certificate generated successfully',
        data: certificate,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Generate certificate error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: { hackathonId: string } }
) {
  try {
    const certificates = await prisma.certificate.findMany({
      where: { hackathonId: params.hackathonId },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json({ data: certificates });
  } catch (error) {
    console.error('Get certificates error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
