import db from '../database/index.js';

const responseBodies = new WeakMap();

// Cache en memoria para configuraciones de auditoría
const configCache = new Map();
let cacheInitialized = false;

// Función para cargar todas las configuraciones en memoria
async function loadAuditConfigs() {
  try {
    const AuditConfig = db.AuditConfig;
    if (!AuditConfig) return;
    
    const configs = await AuditConfig.findAll();
    configCache.clear();
    configs.forEach(config => {
      const key = `${config.resource}:${config.action}`;
      configCache.set(key, config.enabled);
    });
    cacheInitialized = true;
  } catch (err) {
    console.error('Error loading audit configs:', err.message);
  }
}

// Función para verificar si una auditoría está habilitada (usa cache)
async function isAuditEnabled(resource, action) {
  if (!cacheInitialized) {
    await loadAuditConfigs();
  }
  
  const key = `${resource}:${action}`;
  
  // Si existe en cache, usar el valor cacheado
  if (configCache.has(key)) {
    return configCache.get(key);
  }
  
  // Si no existe en cache, crear con valor por defecto (habilitado)
  try {
    const AuditConfig = db.AuditConfig;
    if (AuditConfig) {
      await AuditConfig.create({ resource, action, enabled: true });
      configCache.set(key, true);
    }
    return true;
  } catch (err) {
    // Si ya existe (race condition), recargar cache
    if (err.name === 'SequelizeUniqueConstraintError') {
      await loadAuditConfigs();
      return configCache.get(key) ?? true;
    }
    console.error('Error creating audit config:', err.message);
    return true; // Por defecto, habilitado
  }
}

// Función para actualizar el cache cuando se modifica una config
export function updateAuditConfigCache(resource, action, enabled) {
  const key = `${resource}:${action}`;
  configCache.set(key, enabled);
}

const stripQuery = (path) => {
  if (!path) return '';
  return path.split('?')[0];
};

const actionFromMethod = (method, path) => {
  const clean = stripQuery(path);
  const segments = clean.replace(/^\/+|\/+$/g, '').split('/');
  const lastSegment = (segments[segments.length - 1] || '').toLowerCase();

  if (method === 'POST') {
    const specialActions = ['login', 'logout', 'create'];
    for (const action of specialActions) {
      if (lastSegment === action || lastSegment.startsWith(action + '-') || lastSegment.startsWith(action + '/')) {
        return action;
      }
    }
    return 'create';
  }
  if (method === 'GET') return 'read';
  if (method === 'PUT') return 'update';
  if (method === 'DELETE') return 'delete';
  return method.toLowerCase();
};

const resourceFromPath = (path) => {
  const clean = stripQuery(path);
  const segments = clean.replace(/^\/+|\/+$/g, '').split('/');
  const apiIndex = segments.findIndex((s) => s === 'api');
  if (apiIndex !== -1 && segments[apiIndex + 1]) {
    return segments[apiIndex + 1];
  }
  return segments[0] || 'unknown';
};

const resourceIdFromPath = (path) => {
  const clean = stripQuery(path);
  const segments = clean.replace(/^\/+|\/+$/g, '').split('/');
  for (let i = segments.length - 1; i >= 0; i--) {
    if (/^\d+$/.test(segments[i])) return segments[i];
  }
  return null;
};

const resolveModel = (resource) => {
  const overrides = {
    'users': db.Users,
    'roles': db.Role,
    'permissions': db.Permission,
  };
  if (overrides[resource]) return overrides[resource];
  const modelName = resource.charAt(0).toUpperCase() + resource.slice(1);
  return db[modelName] || null;
};

const getEmail = (req, res, capturedData) => {
  try {
    if (capturedData?.email) return capturedData.email;
    if (req?.user?.email) return req.user.email;
    if (req?.body?.email) return req.body.email;
    const body = responseBodies.get(res);
    if (body?.user?.email) return body.user.email;
    if (body?.userEmail) return body.userEmail;
    return null;
  } catch (err) {
    return null;
  }
};

const getUserId = (req, res, capturedData) => {
  try {
    if (capturedData?.userId) return capturedData.userId;
    if (req?.user?.id) return req.user.id;
    const body = responseBodies.get(res);
    if (body?.user?.id) return body.user.id;
    return null;
  } catch (err) {
    return null;
  }
};

const generateDescription = (action, resource, resourceId, email) => {
  const who = email || 'Unknown user';
  const what = {
    login: 'Inicio de sesión',
    logout: 'Cierre de sesión',
    create: 'Creación',
    read: 'Consulta',
    update: 'Actualización',
    delete: 'Eliminación',
  }[action] || action;

  const target = resourceId
    ? `${resource} #${resourceId}`
    : resource;

  return `${who} realizó "${what}" en ${target}`;
};

// Guardar audit de forma segura sin bloquear
function saveAuditSafe(req, res, action, resource, capturedData) {
  // Ejecutar de forma asíncrona pero sin esperar
  (async () => {
    try {
      const enabled = await isAuditEnabled(resource, action);
      if (!enabled) return;

      const resourceId = resourceIdFromPath(req.originalUrl) || req.params?.id || null;
      const email = getEmail(req, res, capturedData);
      const userId = getUserId(req, res, capturedData);

      let oldValues = null;
      if ((action === 'update' || action === 'delete') && resourceId) {
        try {
          const Model = resolveModel(resource);
          if (Model) {
            const record = await Model.findByPk(resourceId);
            if (record) {
              oldValues = record.toJSON();
              delete oldValues.password;
            }
          }
        } catch {
          // ignore
        }
      }

      const responseBody = responseBodies.get(res);

      const newValues = (action === 'create' || action === 'update') && responseBody
        ? responseBody
        : null;

      const description = generateDescription(action, resource, resourceId, email);

      await db.AuditLog.create({
        userId,
        userEmail: email,
        action,
        resource,
        resourceId: resourceId?.toString() || null,
        description,
        oldValues,
        newValues,
        ip: req.ip || req.connection?.remoteAddress || null,
        userAgent: req.headers?.['user-agent'] || null,
      });
    } catch (err) {
      console.error('Audit save error:', err.message);
    } finally {
      // Limpiar el body del WeakMap
      responseBodies.delete(res);
    }
  })();
}

// No-op middleware para tests
const noOpMiddleware = () => (req, res, next) => next();

export const autoAudit = () => {
  // Deshabilitar completamente en tests
  if (process.env.NODE_ENV === 'test') {
    return noOpMiddleware();
  }

  return (req, res, next) => {
    // Solo procesar si la DB está disponible
    if (!db || !db.AuditLog) {
      return next();
    }

    const resource = resourceFromPath(req.originalUrl);
    const action = actionFromMethod(req.method, req.originalUrl);

    const capturedData = {
      email: req.body?.email || null,
      userId: req.user?.id || null,
    };

    // Guardar referencia al json original
    const originalJson = res.json.bind(res);
    
    // Reemplazar json para capturar el body
    res.json = function (body) {
      try {
        // Solo guardar si es un objeto válido
        if (body && typeof body === 'object') {
          responseBodies.set(res, body);
        }
      } catch (e) {
        // Ignorar errores al guardar el body
      }
      return originalJson(body);
    };

    // Solo registrar el evento finish una vez
    const finishHandler = () => {
      saveAuditSafe(req, res, action, resource, capturedData);
      res.removeListener('finish', finishHandler);
    };

    res.on('finish', finishHandler);

    next();
  };
};

export const audit = (resource, action) => {
  // Deshabilitar completamente en tests
  if (process.env.NODE_ENV === 'test') {
    return noOpMiddleware();
  }

  return (req, res, next) => {
    // Solo procesar si la DB está disponible
    if (!db || !db.AuditLog) {
      return next();
    }

    const capturedData = {
      email: req.body?.email || null,
      userId: req.user?.id || null,
    };

    // Guardar referencia al json original
    const originalJson = res.json.bind(res);
    
    // Reemplazar json para capturar el body
    res.json = function (body) {
      try {
        // Solo guardar si es un objeto válido
        if (body && typeof body === 'object') {
          responseBodies.set(res, body);
        }
      } catch (e) {
        // Ignorar errores al guardar el body
      }
      return originalJson(body);
    };

    // Solo registrar el evento finish una vez
    const finishHandler = () => {
      saveAuditSafe(req, res, action, resource, capturedData);
      res.removeListener('finish', finishHandler);
    };

    res.on('finish', finishHandler);

    next();
  };
};
