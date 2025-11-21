const authService = require('../services/authService');
const emailService = require('../services/mailService');
const { generateToken } = require('../utils/jwt');

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    try {
        const user = await authService.loginUser(email, password);
        const token = generateToken(user);

        res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: {
                id: user.id,
                auth_token: token,
                email: user.email,
                first_name: user.first_name,
                middle_name: user.middle_name,
                last_name: user.last_name,
                mother_last_name: user.mother_last_name
            }
        });
    } catch (error) {
        res.status(401).json({
            success: false,
            message: error.message
        });
    }
};

const getMe = async (req, res) => {
    if (!req.user?.id) {
        return res.status(401).json({
            success: false,
            message: 'Usuario no autenticado'
        });
    }

    const userId = req.user.id;

    try {
        const myUser = await authService.getMyUser(userId);
        res.status(200).json({
            success: true,
            data: {
                id: myUser.id,
                first_name: myUser.first_name,
                middle_name: myUser.middle_name,
                last_name: myUser.last_name,
                mother_last_name: myUser.mother_last_name,
                email: myUser.email,
                profile_image_url: myUser.profile_image_url,
                role: myUser.role,
                abilities: myUser.abilities
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

const register = async (req, res) => {
    try {
        const data = {
            firstName: req.body['first-name'],
            middleName: req.body['middle-name'] || null,
            lastName: req.body['last-name'],
            motherLastName: req.body['mother-last-name'] || null,
            email: req.body.email,
            password: req.body.password,
            gender: req.body.gender,
            birthDate: req.body['birthdate'],
            profileImageId: req.body.profileImageId || null,
        };

        const result = await authService.registerUser(data);

        await emailService.sendVerificationEmail(result.user.email, result.verificationToken);

        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente. Por favor verifica tu correo electrónico.',
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        })
    }
};

const verifyEmail = async (req, res) => {
    try {
        const verified = await authService.verifyUserEmail(req.params.token);
        if (verified) {
            return res.status(200).json({
                success: true,
                message: 'Correo electrónico verificado exitosamente.',
            });
        } else {
            res.status(400).send('<h1>Error: El enlace es inválido o ha expirado.</h1>');
        }
    } catch (error) {
        res.status(500).send(error.message);
    }
}

module.exports = {
    login, 
    getMe,
    register,
    verifyEmail
};