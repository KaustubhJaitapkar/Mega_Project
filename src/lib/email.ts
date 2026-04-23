import nodemailer, { Transporter } from 'nodemailer';
import { SendVerificationRequestParams } from 'next-auth/providers/email';

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_PORT === '465',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD,
    },
  });

  return transporter;
}

export async function sendVerificationEmail({
  url,
  identifier: email,
}: SendVerificationRequestParams) {
  const transport = getTransporter();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to Hackmate</h1>
      <p>Click the link below to sign in to your account:</p>
      <a href="${url}" style="background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
        Sign in to Hackmate
      </a>
      <p style="margin-top: 20px; color: #666;">Or copy this link: ${url}</p>
      <p style="color: #999; font-size: 12px; margin-top: 40px;">This link expires in 24 hours.</p>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Sign in to Hackmate',
    html: emailHtml,
  });
}

export async function sendWelcomeEmail(email: string, name: string) {
  const transport = getTransporter();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Welcome to Hackmate, ${name}!</h1>
      <p>We're excited to have you join our community.</p>
      <p>Visit your profile to complete your setup and start participating in hackathons.</p>
      <a href="${process.env.NEXTAUTH_URL}/profile" style="background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
        Go to Profile
      </a>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Hackmate',
    html: emailHtml,
  });
}

export async function sendTeamInvitation(
  email: string,
  teamName: string,
  inviterName: string,
  acceptLink: string
) {
  const transport = getTransporter();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Team Invitation</h1>
      <p>${inviterName} has invited you to join the team: <strong>${teamName}</strong></p>
      <a href="${acceptLink}" style="background-color: #10b981; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
        Accept Invitation
      </a>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invited to join ${teamName}`,
    html: emailHtml,
  });
}

export async function sendHelpTicketUpdate(
  email: string,
  ticketId: string,
  status: string
) {
  const transport = getTransporter();

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #6366f1;">Help Ticket Update</h1>
      <p>Your help ticket has been updated to: <strong>${status}</strong></p>
      <a href="${process.env.NEXTAUTH_URL}/tickets/${ticketId}" style="background-color: #6366f1; color: white; padding: 10px 20px; border-radius: 5px; text-decoration: none; display: inline-block;">
        View Ticket
      </a>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Help Ticket Update: ${status}`,
    html: emailHtml,
  });
}

export async function sendMentorJudgeInvite(
  email: string,
  hackathonTitle: string,
  role: string,
  acceptUrl: string,
  organiserName: string
) {
  const transport = getTransporter();

  const roleDisplay = role.toLowerCase();
  const color = role === 'MENTOR' ? '#10b981' : '#6366f1';

  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: ${color};">${roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1)} Invitation</h1>
      <p>${organiserName} has invited you to join as ${roleDisplay} for the hackathon: <strong>${hackathonTitle}</strong></p>
      <a href="${acceptUrl}" style="background-color: ${color}; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; display: inline-block; font-weight: bold;">
        Accept Invitation & Set Up Account
      </a>
      <p style="margin-top: 20px; color: #666; font-size: 14px;">This invitation expires in 7 days.</p>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `Invite to ${hackathonTitle} as ${roleDisplay}`,
    html: emailHtml,
  });
}
