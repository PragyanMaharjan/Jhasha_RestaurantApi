require('dotenv').config();
const nodemailer = require('nodemailer');

async function testEmail() {
  console.log('Testing email configuration...');
  console.log('SMTP Host:', process.env.SMTP_HOST || process.env.EMAIL_HOST);
  console.log('SMTP User:', process.env.SMTP_USER || process.env.EMAIL_USER);
  console.log('SMTP Pass:', process.env.SMTP_PASS || process.env.EMAIL_PASSWORD ? '***configured***' : 'NOT SET');
  console.log('Password length:', (process.env.SMTP_PASS || process.env.EMAIL_PASSWORD || '').length);

  const config = {
    host: process.env.SMTP_HOST || process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || process.env.EMAIL_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER || process.env.EMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
    },
  };

  console.log('\nTransporter config:', {
    ...config,
    auth: { user: config.auth.user, pass: '***' }
  });

  const transporter = nodemailer.createTransporter(config);

  try {
    console.log('\nVerifying SMTP connection...');
    await transporter.verify();
    console.log('✅ SMTP connection successful!');

    console.log('\nSending test email...');
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.EMAIL_FROM || '"Jhasha Restaurant" <noreply@jhasha.com>',
      to: 'mhrzn.p02@gmail.com',
      subject: 'Test Email from Jhasha Restaurant',
      html: '<h1>Test Email</h1><p>If you receive this, email configuration is working!</p>',
    });

    console.log('✅ Email sent successfully!');
    console.log('Message ID:', info.messageId);
  } catch (error) {
    console.error('❌ Email error:', error.message);
    console.error('Full error:', error);
  }
}

testEmail();
