import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config/index.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { AppError } from '../utils/AppError.js';
import { notificationService } from '../services/notification.service.js';

// ── Helpers ──────────────────────────────────────────────────────────────────

const generateVerificationCode = () =>
  String(Math.floor(100000 + Math.random() * 900000));

const signTokens = (userId) => {
  const accessToken = jwt.sign({ id: userId }, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
  });
  const refreshToken = jwt.sign({ id: userId }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn,
  });
  return { accessToken, refreshToken };
};

// ── 1) POST /api/user/register ────────────────────────────────────────────────

export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const existing = await User.findOne({ email, status: 'verified' });
    if (existing) throw AppError.conflict('El email ya está registrado y verificado');

    const hashed = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();

    const created = await User.create({
      email,
      password: hashed,
      verificationCode,
      verificationAttempts: 3,
    });

    const { accessToken, refreshToken } = signTokens(created._id);

    const user = await User.findByIdAndUpdate(
      created._id,
      { refreshToken },
      { new: true }
    );

    notificationService.emit('user:registered', { email });

    // En producción se enviaría por correo; aquí lo devolvemos en consola
    console.log(`[VERIFICATION CODE] ${email}: ${verificationCode}`);

    res.status(201).json({
      ok: true,
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── 2) PUT /api/user/validation ───────────────────────────────────────────────

export const validateEmail = async (req, res, next) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user._id);

    if (user.status === 'verified') {
      return res.json({ ok: true, message: 'El email ya estaba verificado' });
    }

    if (user.verificationAttempts <= 0) {
      throw AppError.tooManyRequests('Se han agotado los intentos de verificación');
    }

    if (user.verificationCode !== code) {
      await User.findByIdAndUpdate(user._id, { $inc: { verificationAttempts: -1 } });
      const remaining = user.verificationAttempts - 1;
      if (remaining <= 0) {
        throw AppError.tooManyRequests('Se han agotado los intentos de verificación');
      }
      throw AppError.badRequest(`Código incorrecto. Intentos restantes: ${remaining}`);
    }

    await User.findByIdAndUpdate(user._id, {
      status: 'verified',
      verificationCode: undefined,
    });

    notificationService.emit('user:verified', { email: user.email });

    res.json({ ok: true, message: 'Email verificado correctamente' });
  } catch (err) {
    next(err);
  }
};

// ── 3) POST /api/user/login ───────────────────────────────────────────────────

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email, deleted: false });
    if (!user) throw AppError.unauthorized('Credenciales incorrectas');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw AppError.unauthorized('Credenciales incorrectas');

    const { accessToken, refreshToken } = signTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken });

    res.json({
      ok: true,
      user: { email: user.email, status: user.status, role: user.role },
      accessToken,
      refreshToken,
    });
  } catch (err) {
    next(err);
  }
};

// ── 4a) PUT /api/user/register — Datos personales ────────────────────────────

export const updatePersonalData = async (req, res, next) => {
  try {
    const { name, lastName, nif } = req.body;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name, lastName, nif },
      { new: true, runValidators: true }
    ).select('-password -verificationCode -refreshToken');

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

// ── 4b) PATCH /api/user/company — Datos de compañía ──────────────────────────

export const updateCompany = async (req, res, next) => {
  try {
    const currentUser = await User.findById(req.user._id);
    let companyData;

    if (req.body.isFreelance) {
      // Autónomo: usa datos del propio usuario
      if (!currentUser.nif) {
        throw AppError.badRequest('Completa tus datos personales (NIF) antes del onboarding de autónomo');
      }
      companyData = {
        name: currentUser.name || currentUser.email,
        cif: currentUser.nif,
        address: currentUser.address,
        isFreelance: true,
      };
    } else {
      companyData = {
        name: req.body.name,
        cif: req.body.cif,
        address: req.body.address,
        isFreelance: false,
      };
    }

    // Buscar si ya existe una Company con ese CIF
    let company = await Company.findOne({ cif: companyData.cif });

    if (!company) {
      // Crear nueva Company — el usuario es owner y mantiene role admin
      company = await Company.create({ ...companyData, owner: currentUser._id });
    } else {
      // Unirse a la compañía existente → role guest
      await User.findByIdAndUpdate(currentUser._id, { role: 'guest' });
    }

    await User.findByIdAndUpdate(currentUser._id, { company: company._id });

    res.json({ ok: true, company });
  } catch (err) {
    next(err);
  }
};

// ── 5) PATCH /api/user/logo ───────────────────────────────────────────────────

export const uploadLogo = async (req, res, next) => {
  try {
    if (!req.file) throw AppError.badRequest('No se proporcionó ningún archivo');

    const user = await User.findById(req.user._id);
    if (!user.company) {
      throw AppError.badRequest('El usuario no tiene una compañía asociada');
    }

    const logoUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;

    const company = await Company.findByIdAndUpdate(
      user.company,
      { logo: logoUrl },
      { new: true }
    );

    res.json({ ok: true, logo: company.logo });
  } catch (err) {
    next(err);
  }
};

// ── 6) GET /api/user ──────────────────────────────────────────────────────────

export const getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -verificationCode -refreshToken')
      .populate('company');

    res.json({ ok: true, user });
  } catch (err) {
    next(err);
  }
};

// ── 7a) POST /api/user/refresh ────────────────────────────────────────────────

export const refresh = async (req, res, next) => {
  try {
    const { refreshToken } = req.body;

    let payload;
    try {
      payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
    } catch {
      throw AppError.unauthorized('Refresh token inválido o expirado');
    }

    const user = await User.findById(payload.id);
    if (!user || user.deleted || user.refreshToken !== refreshToken) {
      throw AppError.unauthorized('Refresh token no válido');
    }

    const { accessToken, refreshToken: newRefresh } = signTokens(user._id);
    await User.findByIdAndUpdate(user._id, { refreshToken: newRefresh });

    res.json({ ok: true, accessToken, refreshToken: newRefresh });
  } catch (err) {
    next(err);
  }
};

// ── 7b) POST /api/user/logout ─────────────────────────────────────────────────

export const logout = async (req, res, next) => {
  try {
    await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    res.json({ ok: true, message: 'Sesión cerrada correctamente' });
  } catch (err) {
    next(err);
  }
};

// ── 8) DELETE /api/user ───────────────────────────────────────────────────────

export const deleteUser = async (req, res, next) => {
  try {
    const soft = req.query.soft === 'true';
    const user = req.user;

    if (soft) {
      await User.findByIdAndUpdate(user._id, { deleted: true, refreshToken: null });
    } else {
      await User.findByIdAndDelete(user._id);
    }

    notificationService.emit('user:deleted', { email: user.email, soft });

    res.json({ ok: true, message: `Usuario eliminado (${soft ? 'soft' : 'hard'} delete)` });
  } catch (err) {
    next(err);
  }
};

// ── 9) PUT /api/user/password ─────────────────────────────────────────────────

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user._id);
    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw AppError.badRequest('La contraseña actual es incorrecta');

    const hashed = await bcrypt.hash(newPassword, 12);
    await User.findByIdAndUpdate(user._id, { password: hashed });

    res.json({ ok: true, message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    next(err);
  }
};

// ── 10) POST /api/user/invite ─────────────────────────────────────────────────

export const inviteUser = async (req, res, next) => {
  try {
    const { email, password, name, lastName } = req.body;
    const inviter = req.user;

    if (!inviter.company) {
      throw AppError.badRequest('Debes tener una compañía para invitar usuarios');
    }

    const existing = await User.findOne({ email, deleted: false });
    if (existing) throw AppError.conflict('El email ya está registrado');

    const hashed = await bcrypt.hash(password, 12);
    const verificationCode = generateVerificationCode();

    const newUser = await User.create({
      email,
      password: hashed,
      name,
      lastName,
      role: 'guest',
      status: 'pending',
      company: inviter.company,
      verificationCode,
      verificationAttempts: 3,
    });

    notificationService.emit('user:invited', {
      email: newUser.email,
      company: inviter.company,
    });

    console.log(`[VERIFICATION CODE] ${email}: ${verificationCode}`);

    res.status(201).json({
      ok: true,
      user: { email: newUser.email, role: newUser.role, status: newUser.status },
    });
  } catch (err) {
    next(err);
  }
};
