const favoriteRepository = require('../repositories/favoriteRepository');

const toggleFavorite = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;

        console.log(`[FavoriteController] Toggling favorite for User ${userId} and Project ${projectId}`);

        const isFavorited = await favoriteRepository.toggleFavorite(userId, projectId);

        console.log(`[FavoriteController] Result: ${isFavorited}`);

        res.json({
            success: true,
            message: isFavorited ? 'Proyecto agregado a favoritos' : 'Proyecto removido de favoritos',
            data: { is_favorited: isFavorited }
        });
    } catch (error) {
        console.error('Error toggling favorite:', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar favoritos'
        });
    }
};

const getUserFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const favorites = await favoriteRepository.getUserFavorites(userId);

        res.json({
            success: true,
            data: { projects: favorites }
        });
    } catch (error) {
        console.error('Error getting favorites:', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener favoritos'
        });
    }
};

module.exports = {
    toggleFavorite,
    getUserFavorites
};
