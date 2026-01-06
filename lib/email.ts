import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to,
      subject,
      html,
      text,
    });
    return { success: true };
  } catch (error) {
    console.error('Failed to send email:', error);
    return { success: false, error };
  }
}

export async function sendEventReminderEmail({
  email,
  studentName,
  eventTitle,
  eventDate,
  eventLocation,
  eventLink,
}: {
  email: string;
  studentName: string;
  eventTitle: string;
  eventDate: Date;
  eventLocation?: string;
  eventLink?: string;
}) {
  const formattedDate = eventDate.toLocaleString('en-US', {
    dateStyle: 'full',
    timeStyle: 'short',
  });

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2563eb; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
        .button { display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 6px; margin-top: 16px; }
        .details { background-color: white; padding: 16px; border-radius: 8px; margin: 16px 0; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Event Reminder</h1>
        </div>
        <div class="content">
          <p>Hi ${studentName},</p>
          <p>This is a reminder that you're registered for the following event:</p>
          <div class="details">
            <h2>${eventTitle}</h2>
            <p><strong>Date & Time:</strong> ${formattedDate}</p>
            ${eventLocation ? `<p><strong>Location:</strong> ${eventLocation}</p>` : ''}
            ${eventLink ? `<p><strong>Virtual Link:</strong> <a href="${eventLink}">${eventLink}</a></p>` : ''}
          </div>
          <p>We're looking forward to seeing you there!</p>
          ${eventLink ? `<a href="${eventLink}" class="button">Join Event</a>` : ''}
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Reminder: ${eventTitle}`,
    html,
    text: `Hi ${studentName},\n\nThis is a reminder that you're registered for ${eventTitle} on ${formattedDate}.`,
  });
}

export async function sendApplicationConfirmationEmail({
  email,
  studentName,
  jobTitle,
  companyName,
}: {
  email: string;
  studentName: string;
  jobTitle: string;
  companyName: string;
}) {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #10b981; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9fafb; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>Application Submitted</h1>
        </div>
        <div class="content">
          <p>Hi ${studentName},</p>
          <p>Your application for <strong>${jobTitle}</strong> at <strong>${companyName}</strong> has been successfully submitted.</p>
          <p>The employer will review your application and reach out if you're a good fit.</p>
          <p>Good luck!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  return sendEmail({
    to: email,
    subject: `Application Submitted: ${jobTitle} at ${companyName}`,
    html,
    text: `Hi ${studentName},\n\nYour application for ${jobTitle} at ${companyName} has been successfully submitted.`,
  });
}
