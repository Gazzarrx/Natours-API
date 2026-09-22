const nodemailer = require('nodemailer');

const sendEmail = async (option) => {
    // 1) Create a transporter
    var transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
    //  2) DEFINE tHE EMAIL OPTIONS
    const mailOptions = {
        from: option.email,
        to: option.email,
        subject: option.subject,
        text: option.message
    }

    // 3) Sending Email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;