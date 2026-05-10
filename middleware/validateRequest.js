import { z } from 'zod';

/**
 * Middleware factory para validar requests con Zod
 * @param {z.ZodSchema} schema - Schema de Zod a validar
 * @param {string} source - Fuente de datos: 'body', 'query', 'params'
 */
export const validateRequest = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      const data = req[source];
      const validated = await schema.parseAsync(data);
      
      // Reemplazar los datos originales con los validados
      req[source] = validated;
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }));
        
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: errors.map(e => `${e.field}: ${e.message}`)
        });
      }
      
      next(error);
    }
  };
};

/**
 * Middleware para validar que los datos son del tipo correcto
 * Convierte strings a números/booleanos cuando sea necesario
 */
export const sanitizeRequest = (req, res, next) => {
  // Sanitizar query params
  if (req.query) {
    Object.keys(req.query).forEach(key => {
      const value = req.query[key];
      
      // Convertir 'true'/'false' strings a booleanos
      if (value === 'true') req.query[key] = true;
      if (value === 'false') req.query[key] = false;
      
      // Convertir strings numéricos a números
      if (!isNaN(value) && !isNaN(parseFloat(value)) && key !== 'search') {
        req.query[key] = Number(value);
      }
    });
  }
  
  next();
};