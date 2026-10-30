import jwt from 'jsonwebtoken';

export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access denied: No authentication token provided'
    });
  }

  const secret = process.env.JWT_SECRET || 'scholarmesh_ultra_secure_jwt_secret_key_2026_scholar_mesh';

  try {
    const decoded = jwt.verify(token, secret);
    req.user = {
      id: decoded.id,
      email: decoded.email,
      full_name: decoded.full_name
    };
    next();
  } catch (error) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Invalid or expired token'
    });
  }
};

export default authenticateToken;
