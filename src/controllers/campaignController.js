const campaignRepository = require('../repositories/campaignRepository');

const updateCampaignStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const userId = req.user.id;
        
        if (!['active', 'paused', 'finished'].includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Estado de campaña inválido'
            });
        }
        
        await campaignRepository.updateCampaignStatus(id, status, userId);
        
        res.json({
            success: true,
            message: 'Estado de campaña actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error actualizando estado de campaña:', error);
        
        const statusCode = error.message.includes('permiso') ? 403 :
                          error.message.includes('no encontrado') ? 404 :
                          error.message.includes('No puedes') ? 400 :
                          error.message.includes('aprobado') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    updateCampaignStatus
};
