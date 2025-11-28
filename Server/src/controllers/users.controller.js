const { request, response } = require('express');
const bcrypt = require('bcryptjs');
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

// Perfil del usuario autenticado (si se usa req.user)
const getProfile = async (req = request, res = response) => {
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({
      msg: 'Usuario no autenticado',
    });
  }

  try {
    const user = await User.findById(userId, 'username fullName password rol');
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
    console.error('[users.controller] Error al obtener perfil', error);
    return res.status(500).json({
      msg: 'Error al obtener el perfil',
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

// Actualiza la contraseña del usuario autenticado
const updateMyPassword = async (req = request, res = response) => {
  const userId = req.user?.id;
  const { newPassword } = req.body;

  if (!userId) {
    return res.status(401).json({ msg: 'Usuario no autenticado' });
  }
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    return res.status(400).json({ msg: 'La nueva contraseña es requerida y debe tener al menos 6 caracteres' });
  }

  try {
    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    const updated = await User.findByIdAndUpdate(
      userId,
      { password: hashed },
      { new: true, fields: 'username fullName rol' }
    );

    if (!updated) {
      return res.status(404).json({ msg: 'Usuario no encontrado' });
    }

    return res.status(200).json({
      msg: 'Contraseña actualizada correctamente',
      result: {
        _id: updated._id,
        username: updated.username,
        fullName: updated.fullName,
        rol: updated.rol,
      },
    });
  } catch (error) {
    console.error('[users.controller] Error al actualizar contraseña', error);
    return res.status(500).json({ msg: 'Error al actualizar la contraseña' });
  }
};

// Elimina un usuario por id
const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        msg: 'Usuario no encontrado',
      });
    }
    return res.status(200).json({
      msg: 'Usuario eliminado correctamente',
      result: { _id: deleted._id, username: deleted.username },
    });
  } catch (error) {
    console.error('[users.controller] Error al eliminar usuario', error);
    return res.status(500).json({
      msg: 'Error al eliminar el usuario',
    });
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUserRole,
  getProfile,
  updateMyPassword,
  deleteUser,
};
