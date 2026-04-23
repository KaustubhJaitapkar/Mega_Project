import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import QRCode from 'qrcode';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(req.url);
    const hackathonId = url.searchParams.get('hackathonId');

    if (!hackathonId) {
      return NextResponse.json({ error: 'hackathonId required' }, { status: 400 });
    }

    const userId = (session.user as any).id;
    const qrData = `${userId}:${hackathonId}`;

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      width: 256,
      margin: 2,
      color: {
        dark: '#1e293b',
        light: '#ffffff',
      },
    });

    return NextResponse.json({
      data: {
        qrCode: qrDataUrl,
        userId,
        hackathonId,
      },
    });
  } catch (error) {
    console.error('QR generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
