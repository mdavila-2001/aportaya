const authService = require('../services/authService');
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

module.exports = {
    login, 
    getMe
};