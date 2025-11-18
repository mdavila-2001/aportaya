const authService = require('../services/authService');
const { generateToken } = require('../utils/jwt');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Por favor completa todos los campos' });
    }

    try {
        const user = await authService.loginUser(email, password);
        const token = generateToken(user);

        res.status(200).json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                email: user.email,
                //Validemos el no mandar espacio doble si no existe middle name y mother_last_name
                user_full_name: `${user.first_name}${user.middle_name ? ' ' + user.middle_name : ''} ${user.last_name}${user.mother_last_name ? ' ' + user.mother_last_name : ''}`.trim()
            }
        });
    } catch (error) {
        res.status(401).json({ message: error.message });
    }
};