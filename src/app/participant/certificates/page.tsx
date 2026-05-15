import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import ParticipantCertificatesClient from './ParticipantCertificatesClient';

export default async function ParticipantCertificatesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect('/login');

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!user) redirect('/login');

  const certificates = await prisma.certificate.findMany({
    where: { userId: user.id },
    select: {
      id: true,
      type: true,
      title: true,
      certificateUrl: true,
      pdfPath: true,
      issuedAt: true,
      hackathon: { select: { id: true, title: true } },
    },
    orderBy: { issuedAt: 'desc' },
  });

  return <ParticipantCertificatesClient certificates={certificates as any} />;
}
