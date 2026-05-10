import { z } from 'zod';

// Schema base para IDs
export const idSchema = z.object({
  id: z.coerce.number().int().positive('ID debe ser un número positivo')
});

// Schema para login
export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Contraseña es requerida')
});

// Schema para crear usuario
export const createUserSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre muy largo'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres'),
  roleId: z.coerce.number().int().positive('Rol inválido'),
  isActive: z.coerce.boolean().default(true)
});

// Schema para actualizar usuario
export const updateUserSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(100, 'Nombre muy largo').optional(),
  email: z.string().email('Email inválido').optional(),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres').optional().or(z.literal('')),
  roleId: z.coerce.number().int().positive('Rol inválido').optional(),
  isActive: z.coerce.boolean().optional()
});

// Schema para crear rol
export const createRoleSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50, 'Nombre muy largo'),
  description: z.string().min(5, 'Descripción muy corta').max(255, 'Descripción muy larga')
});

// Schema para actualizar rol
export const updateRoleSchema = z.object({
  name: z.string().min(2, 'Nombre debe tener al menos 2 caracteres').max(50, 'Nombre muy largo').optional(),
  description: z.string().min(5, 'Descripción muy corta').max(255, 'Descripción muy larga').optional()
});

// Schema para asignar permisos a rol
export const assignPermissionsSchema = z.object({
  permissionIds: z.array(z.number().int().positive()).min(1, 'Debe seleccionar al menos un permiso')
});

// Schema para crear permiso
export const createPermissionSchema = z.object({
  name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo'),
  description: z.string().min(5, 'Descripción muy corta').max(255, 'Descripción muy larga'),
  resource: z.string().min(1, 'Recurso es requerido').max(50, 'Recurso muy largo'),
  action: z.enum(['create', 'read', 'update', 'delete'], {
    errorMap: () => ({ message: 'Acción debe ser: create, read, update o delete' })
  })
});

// Schema para actualizar permiso
export const updatePermissionSchema = z.object({
  name: z.string().min(3, 'Nombre muy corto').max(100, 'Nombre muy largo').optional(),
  description: z.string().min(5, 'Descripción muy corta').max(255, 'Descripción muy larga').optional(),
  resource: z.string().min(1, 'Recurso es requerido').max(50, 'Recurso muy largo').optional(),
  action: z.enum(['create', 'read', 'update', 'delete']).optional()
});

// Schema para recuperación de contraseña
export const forgotPasswordSchema = z.object({
  email: z.string().email('Email inválido')
});

// Schema para reset de contraseña
export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token es requerido'),
  password: z.string().min(6, 'Contraseña debe tener al menos 6 caracteres')
});

// Schema para configuración del sistema
export const systemConfigSchema = z.object({
  configs: z.array(z.object({
    key: z.string(),
    value: z.string()
  })).min(1, 'Debe enviar al menos una configuración')
});

// Schema para configuración de auditoría
export const auditConfigSchema = z.object({
  enabled: z.boolean(),
  logAll: z.boolean(),
  excludedResources: z.array(z.string())
});

// Schema para filtros de logs de auditoría
export const auditLogsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(50),
  userId: z.coerce.number().int().positive().optional(),
  action: z.enum(['create', 'read', 'update', 'delete']).optional(),
  resource: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD').optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha debe ser YYYY-MM-DD').optional()
});