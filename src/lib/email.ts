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
  organiserName: string,
  credentials?: { email: string; temporaryPassword: string }
) {
  const transport = getTransporter();

  const roleDisplay = role.toLowerCase();
  const roleCapitalized = roleDisplay.charAt(0).toUpperCase() + roleDisplay.slice(1);
  const color = role === 'MENTOR' ? '#10b981' : '#6366f1';
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`;

  const credentialsSection = credentials ? `
    <div style="margin: 24px 0; padding: 20px; background: #f8fafc; border-radius: 12px; border: 1.5px solid #e2e8f0;">
      <h3 style="color: #1e293b; font-size: 16px; margin: 0 0 12px 0;">Your Login Credentials</h3>
      <div style="margin-bottom: 12px;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Email</p>
        <p style="color: #1e293b; font-size: 15px; margin: 0; font-family: monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${credentials.email}</p>
      </div>
      <div style="margin-bottom: 16px;">
        <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase; letter-spacing: 0.5px;">Temporary Password</p>
        <p style="color: #1e293b; font-size: 15px; margin: 0; font-family: monospace; background: #ffffff; padding: 8px 12px; border-radius: 6px; border: 1px solid #e2e8f0;">${credentials.temporaryPassword}</p>
      </div>
      <p style="color: #dc2626; font-size: 12px; margin: 0;">⚠️ You will be required to change your password on first login.</p>
    </div>
  ` : '';

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <!-- Header -->
      <div style="text-align: center; margin-bottom: 32px;">
        <div style="display: inline-flex; align-items: center; justify-content: center; width: 56px; height: 56px; background: ${color}; border-radius: 14px; margin-bottom: 16px;">
          <span style="font-size: 24px;">${role === 'MENTOR' ? '🎓' : '⚖️'}</span>
        </div>
        <h1 style="color: #0f172a; font-size: 24px; font-weight: 700; margin: 0 0 8px 0;">
          ${roleCapitalized} Invitation
        </h1>
        <p style="color: #64748b; font-size: 15px; margin: 0;">
          You've been invited to join <strong>${hackathonTitle}</strong>
        </p>
      </div>

      <!-- Main Content -->
      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <p style="color: #334155; font-size: 15px; line-height: 1.6; margin: 0 0 20px 0;">
          <strong>${organiserName}</strong> has invited you to serve as a <strong>${roleCapitalized}</strong> for this hackathon. 
          As a ${roleDisplay}, you will help guide participants, review submissions, and contribute to the success of the event.
        </p>
        
        ${credentialsSection}
        
        <!-- Action Button -->
        <a href="${acceptUrl}" style="display: block; background: ${color}; color: white; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px; text-align: center; margin-top: 20px;">
          ${credentials ? 'Set Up Your Account' : 'Accept Invitation'}
        </a>
        
        ${!credentials ? `
        <p style="color: #64748b; font-size: 13px; margin: 16px 0 0 0; text-align: center;">
          Or copy this link:<br>
          <span style="color: #6366f1; word-break: break-all;">${acceptUrl}</span>
        </p>
        ` : ''}
      </div>

      <!-- Login Section (if credentials provided) -->
      ${credentials ? `
      <div style="background: #f8fafc; border-radius: 12px; padding: 20px; margin-bottom: 24px; text-align: center;">
        <p style="color: #64748b; font-size: 14px; margin: 0 0 12px 0;">
          After setting up your account, you can log in anytime at:
        </p>
        <a href="${loginUrl}" style="color: #6366f1; font-size: 14px; font-weight: 500;">
          ${loginUrl}
        </a>
      </div>
      ` : ''}

      <!-- Footer -->
      <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e2e8f0;">
        <p style="color: #94a3b8; font-size: 12px; margin: 0;">
          This invitation expires in 7 days. If you did not expect this invitation, you can safely ignore this email.
        </p>
        <p style="color: #cbd5e1; font-size: 11px; margin: 12px 0 0 0;">
          Powered by Hackmate
        </p>
      </div>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[${hackathonTitle}] Invitation to join as ${roleCapitalized}`,
    html: emailHtml,
  });
}

// Send credentials reminder email
export async function sendCredentialsReminder(
  email: string,
  hackathonTitle: string,
  role: string,
  temporaryPassword: string
) {
  const transport = getTransporter();
  const loginUrl = `${process.env.NEXTAUTH_URL}/auth/signin`;
  const roleDisplay = role.toLowerCase();
  const color = role === 'MENTOR' ? '#10b981' : '#6366f1';

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px;">
      <div style="text-align: center; margin-bottom: 32px;">
        <h1 style="color: #0f172a; font-size: 22px; margin: 0 0 8px 0;">Login Credentials Reminder</h1>
        <p style="color: #64748b; font-size: 14px; margin: 0;">
          For your role as ${roleDisplay} at <strong>${hackathonTitle}</strong>
        </p>
      </div>

      <div style="background: #ffffff; border: 1.5px solid #e2e8f0; border-radius: 12px; padding: 24px;">
        <div style="margin-bottom: 16px;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Email</p>
          <p style="color: #1e293b; font-size: 15px; margin: 0; font-family: monospace; background: #f8fafc; padding: 10px; border-radius: 6px;">${email}</p>
        </div>
        <div style="margin-bottom: 20px;">
          <p style="color: #64748b; font-size: 12px; margin: 0 0 4px 0; text-transform: uppercase;">Password</p>
          <p style="color: #1e293b; font-size: 15px; margin: 0; font-family: monospace; background: #f8fafc; padding: 10px; border-radius: 6px;">${temporaryPassword}</p>
        </div>
        <a href="${loginUrl}" style="display: block; background: ${color}; color: white; padding: 14px; border-radius: 10px; text-decoration: none; font-weight: 600; text-align: center;">
          Go to Login
        </a>
      </div>
    </div>
  `;

  await transport.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: `[${hackathonTitle}] Your login credentials`,
    html: emailHtml,
  });
}
