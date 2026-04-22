import PDFDocument from 'pdfkit';
import { createWriteStream, mkdirSync } from 'fs';
import { join } from 'path';
import { CertificateType } from '@/types';

export async function generateCertificate(
  name: string,
  type: CertificateType,
  hackathonName: string,
  date: Date
): Promise<string> {
  const doc = new PDFDocument({
    size: 'A4',
    margin: 50,
    orientation: 'landscape',
  });

  const certificatesDir = join(process.cwd(), 'public', 'certificates');
  mkdirSync(certificatesDir, { recursive: true });

  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.pdf`;
  const filepath = join(certificatesDir, filename);

  return new Promise((resolve, reject) => {
    const stream = createWriteStream(filepath);

    doc.pipe(stream);

    // Background
    doc.fillColor('#f3f4f6');
    doc.rect(0, 0, doc.page.width, doc.page.height).fill();

    // Border
    doc.strokeColor('#6366f1');
    doc.lineWidth(3);
    doc.rect(40, 40, doc.page.width - 80, doc.page.height - 80).stroke();

    // Title
    doc.fillColor('#6366f1');
    doc.fontSize(48);
    doc.text('Certificate of Achievement', { align: 'center', y: 150 });

    // Divider line
    doc.moveTo(150, 210).lineTo(doc.page.width - 150, 210).stroke();

    // Achievement text
    doc.fillColor('#374151');
    doc.fontSize(24);
    doc.text('This is to certify that', { align: 'center', y: 250 });

    // Name
    doc.fillColor('#6366f1');
    doc.fontSize(32);
    doc.font('Helvetica-Bold');
    doc.text(name, { align: 'center', y: 310 });
    doc.font('Helvetica');

    // Type and hackathon
    doc.fillColor('#374151');
    doc.fontSize(18);
    const typeText = getTypeText(type);
    doc.text(`${typeText} in`, { align: 'center', y: 370 });
    
    doc.fillColor('#6366f1');
    doc.fontSize(20);
    doc.font('Helvetica-Bold');
    doc.text(hackathonName, { align: 'center' });
    doc.font('Helvetica');

    // Date
    doc.fillColor('#374151');
    doc.fontSize(14);
    doc.text(`Date: ${date.toLocaleDateString()}`, { align: 'center', y: 480 });

    // Signature line
    doc.moveTo(200, 560).lineTo(400, 560).stroke();
    doc.fontSize(12);
    doc.text('Authorized Signature', 200, 565);

    doc.on('end', () => {
      resolve(`/certificates/${filename}`);
    });

    doc.on('error', reject);

    doc.end();
  });
}

function getTypeText(type: CertificateType): string {
  const typeMap: Record<CertificateType, string> = {
    PARTICIPANT: 'Participated in',
    WINNER: 'Winner of',
    RUNNER_UP: 'Runner-up in',
    BEST_PROJECT: 'Best Project Award in',
  };
  return typeMap[type] || 'Participated in';
}

export async function generateBulkCertificates(
  participants: Array<{ name: string; email: string; type: CertificateType }>,
  hackathonName: string
): Promise<Array<{ email: string; url: string }>> {
  const results: Array<{ email: string; url: string }> = [];

  for (const participant of participants) {
    try {
      const url = await generateCertificate(
        participant.name,
        participant.type,
        hackathonName,
        new Date()
      );
      results.push({ email: participant.email, url });
    } catch (error) {
      console.error(`Failed to generate certificate for ${participant.name}:`, error);
    }
  }

  return results;
}
