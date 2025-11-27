const { request, response } = require('express');
const User = require('../models/user.model');

const getProfile = async (req = request, res = response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      msg: 'Usuario no autenticado',
    });
  }

  try {
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      password: user.password,
      rol: user.rol,
    });
  } catch (error) {
    console.log('[getProfile] Error', error && error.stack ? error.stack : error);
    return res.status(500).json({
      msg: 'Error al obtener el perfil',
    });
  }
};

module.exports = {
  getProfile,
};
