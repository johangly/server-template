# Scripts Utilitarios

Esta carpeta contiene scripts de utilidad para el manejo de la base de datos y operaciones del servidor.

## Scripts Disponibles

### seed-all.js

**Propósito:** Ejecuta TODOS los seeders en el orden correcto.

**Uso:**
```bash
npm run db:seed:all
# o directamente:
node scripts/seed-all.js
```

**Seeders ejecutados en orden:**

1. `20251101155956-seed-roles.cjs` - Roles base (Admin, User, Guest)
2. `20251101173023-seed-users.cjs` - Usuario admin por defecto
3. `20260102000000-seed-permissions.cjs` - Permisos base
4. `20260102000001-seed-admin-permissions.cjs` - Asignar permisos a rol Admin
5. `20260103000000-seed-audit-config.cjs` - Configuración de auditoría
6. `20260103000001-seed-audit-permissions.cjs` - Permisos de auditoría
7. `20260104000000-seed-system-config.cjs` - Configuración del sistema
8. `20260104000001-seed-system-config-permissions.cjs` - Permisos de configuración

**Datos creados:**
- Roles: Admin, User, Guest
- Usuario: admin@example.com / admin123
- Permisos: CRUD completo para todos los módulos
- Configuración: Auditoría activada

---

## Notas

- Los scripts deben ejecutarse desde la carpeta `server/`
- Asegúrate de tener las variables de entorno configuradas antes de ejecutar
- La base de datos debe existir antes de ejecutar los seeders