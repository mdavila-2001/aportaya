const { dbPool } = require('../config/dbConnection');

exports.loginUser = async (email, password) => {
    try {
        const login = "SELECT users.login_user($1, $2) AS user_data";
        const { rows } = await dbPool.query(login, [email, password]);

        const user_id = rows[0].user_id;

        if (!user_id) {
            throw new Error('Credenciales inválidas o usuario no encontrado');
        }

        const userDetails = await dbPool.query(
            `SELECT id, email, first_name, middle_name, last_name, mother_last_name
             FROM users
             WHERE id = $1`,
             [user_id]
        );
        
        return userDetails.rows[0];

    } catch (error) {
        if (error.message === 'Credenciales inválidas o usuario no encontrado') {
            throw error;
        }
        console.error('Error en loginUser:', error.message);
    }
};