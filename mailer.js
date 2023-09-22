
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

export const sendResetPasswordEmail = async (email, token) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Restablecer contraseña',
            text: 'Haz clic en el siguiente enlace para restablecer tu contraseña:',
            html: `<p>Haz clic en el siguiente <a href="http://localhost:8080/reset-password/${token}">enlace</a> para restablecer tu contraseña.</p>`
        };

        await transporter.sendMail(mailOptions);
        console.log('Correo enviado con éxito.');
    } catch (error) {
        console.error('Error al enviar correo:', error);
    }
};
