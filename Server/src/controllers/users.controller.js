const User = require('../models/user.model');
const ALLOWED_ROLES = ['admin', 'user', 'viewer'];

// Obtiene todos los usuarios con sus campos principales
const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, 'username password rol');
    return res.status(200).json({
      msg: 'Usuarios obtenidos correctamente',
      result: users,
    });
  } catch (error) {
    console.error('[users.controller] Error al obtener usuarios', error);
    return res.status(500).json({
      msg: 'Error al obtener los usuarios',
    });
  }
};

// Obtiene un usuario por id
const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id, 'username password rol');
    if (!user) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }
    return res.status(200).json({
      msg: 'Usuario obtenido correctamente',
      result: user,
    });
  } catch (error) {
    console.error('[users.controller] Error al obtener usuario', error);
    return res.status(500).json({
      msg: 'Error al obtener el usuario',
    });
  }
};

// Actualiza el rol de un usuario
const updateUserRole = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body;

  if (!rol || !ALLOWED_ROLES.includes(rol)) {
    return res.status(400).json({
      msg: 'Rol no valido. Usa admin, user o viewer',
    });
  }

  try {
    const updated = await User.findByIdAndUpdate(
      id,
      { rol },
      { new: true, fields: 'username password rol' }
    );

    if (!updated) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }

    return res.status(200).json({
      msg: 'Rol actualizado correctamente',
      result: updated,
    });
  } catch (error) {
    console.error('[users.controller] Error al actualizar rol', error);
    return res.status(500).json({
      msg: 'Error al actualizar el rol del usuario',
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
};
