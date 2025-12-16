const nodemailer = require('nodemailer');

// Generate random 6-digit OTP
function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Configure email transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Send OTP via email
async function sendEmailOTP(email, otp) {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Your ASD Platform OTP Code',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #4a8db7;">ASD Support Platform</h2>
                    <p>Your One-Time Password (OTP) for verification is:</p>
                    <div style="background: #f0f8ff; padding: 20px; text-align: center; margin: 20px 0;">
                        <h1 style="color: #4a8db7; margin: 0; font-size: 32px;">${otp}</h1>
                    </div>
                    <p>This OTP is valid for 10 minutes. Please do not share it with anyone.</p>
                    <p>If you didn't request this, please ignore this email.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending error:', error);
        return false;
    }
}

module.exports = { generateOTP, sendEmailOTP };