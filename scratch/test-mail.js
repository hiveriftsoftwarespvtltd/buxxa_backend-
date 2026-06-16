const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

// Load .env file
const envPath = path.join(__dirname, '..', '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1);
    }
    env[key] = value.trim();
  }
});

console.log('Parsed env variables:');
console.log('EMAIL_HOST:', env.EMAIL_HOST);
console.log('EMAIL_PORT:', env.EMAIL_PORT);
console.log('EMAIL_SECURE:', env.EMAIL_SECURE);
console.log('EMAIL_USER:', env.EMAIL_USER);
console.log('EMAIL_PASS:', env.EMAIL_PASS ? '********' : 'undefined');
console.log('CONTACT_RECEIVER_EMAIL:', env.CONTACT_RECEIVER_EMAIL);

const transporter = nodemailer.createTransport({
  host: env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(env.EMAIL_PORT || '587', 10),
  secure: env.EMAIL_SECURE === 'true',
  auth: {
    user: env.EMAIL_USER,
    pass: env.EMAIL_PASS,
  },
});

const mailOptions = {
  from: `"BUXXA Test Alert" <${env.EMAIL_USER}>`,
  to: env.CONTACT_RECEIVER_EMAIL,
  subject: 'Test Email from BUXXA SMTP Script',
  text: 'This is a test email to verify SMTP configuration.',
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('❌ Error sending mail:', error);
  } else {
    console.log('✅ Email sent successfully:', info.response);
  }
});
