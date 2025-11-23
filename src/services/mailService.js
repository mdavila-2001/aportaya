const nodemailer = require('nodemailer');

// URL base del servidor
const BASE_URL = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;

let testAccount = null;

const createTransporter = async () => {
    if (!testAccount) {
        testAccount = await nodemailer.createTestAccount();
        console.log('Cuenta Ethereal creada: ', testAccount);
    }

    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
            user: testAccount.user,
            pass: testAccount.pass,
        },
    });
};

const sendVerificationEmail = async (toEmail, token) => {
    try {
        const transpoter = await createTransporter();
        
        const verificationLink = `${BASE_URL}/api/verify-email/${token}`;

        const info = await transpoter.sendMail({
            from : `"Soporte AportaYa" <no-reply@aportaya.com>`,
            to: toEmail,
            subject: 'Verificación de correo electrónico - AportaYa ✅✅',
            html: `
                <div style="background-color: #f4f4f4; padding: 20px; font-family: sans-serif;">
                    <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
                        
                        <div style="background-color: #10B981; padding: 20px; text-align: center;">
                            <h1 style="color: white; margin: 0;">AportaYa</h1>
                        </div>
                        
                        <div style="padding: 30px; text-align: center;">
                            <h2 style="color: #333;">¡Hola! Gracias por unirte.</h2>
                            <p style="color: #666; line-height: 1.5;">
                                Estamos muy emocionados de que seas parte de nuestra comunidad de crowdfunding.
                                Para comenzar a publicar o financiar proyectos, necesitamos verificar que este correo es tuyo.
                            </p>
                            
                            <a href="${verificationLink}" style="
                                display: inline-block;
                                background-color: #10B981; 
                                color: white; 
                                padding: 15px 30px; 
                                text-decoration: none; 
                                border-radius: 50px; 
                                font-weight: bold;
                                margin-top: 20px;
                                box-shadow: 0 4px 6px rgba(16, 185, 129, 0.3);">
                                Confirmar mi Cuenta
                            </a>

                            <p style="margin-top: 20px; color: #888; font-size: 12px;">
                                Si el botón no funciona, usa este enlace: <br> ${verificationLink}
                            </p>
                            
                            <p style="margin-top: 30px; font-size: 12px; color: #999;">
                                Si no creaste esta cuenta, puedes ignorar este correo.
                            </p>
                        </div>
                        
                        <div style="background-color: #eee; padding: 10px; text-align: center; font-size: 11px; color: #777;">
                            © 2025 AportaYa
                        </div>
                    </div>
                </div>
            `,
        });

        console.log('📨 Mensaje enviado (ID): %s', info.messageId);
        
        const previewUrl = nodemailer.getTestMessageUrl(info);
        console.log("⭐ [VISTA PREVIA] Abre este link para ver el correo simulado:");
        console.log("----------------------------------------------------------");
        console.log(previewUrl);
        console.log("----------------------------------------------------------");

        // Devolver el link de vista previa para mostrarlo en el frontend
        return {
            success: true,
            previewUrl: previewUrl
        };
    } catch (error) {
        console.error('Error enviando correo de verificación:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

module.exports = {
    sendVerificationEmail,
};