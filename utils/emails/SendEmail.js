import nodemailer from 'nodemailer';
import emailHtmlContent from './emailHtmlContent.js';

const sendEmail = async (options) => {
  try {
    // 1. Create transporter
    const transporter = nodemailer.createTransport({
      host: 'localhost',
      port: 1025,
      secure: false,
    });

    // 2. Verify SMTP connection
    console.log('Verifying SMTP connection...');
    await transporter.verify();
    console.log('SMTP connection verified successfully');

    // 3. Setup email options
    const mailOptions = {
      from: 'SpendLog <spendlog@expense.com>',
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: emailHtmlContent
    };

    // 4. Send email
    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    
    // 5. Log success
    console.log('Email sent successfully!');
    console.log('Message ID:', info.messageId);
    console.log('Preview URL:', nodemailer.getTestMessageUrl(info));
    
    return info;
  } catch (error) {
    console.error('Error in sendEmail:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

export default sendEmail;
