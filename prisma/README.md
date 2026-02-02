# Prisma Migrations Guide

## 🚀 Quick Start

### Initial Setup (New Database)

```bash
# 1. Create and apply migrations
npx prisma migrate dev --name init

# 2. Seed the database
npx prisma db seed
```

### Production Deployment

```bash
# Apply migrations (non-interactive)
npx prisma migrate deploy

# Seed the database
npx prisma db seed
```

### Development Workflow

```bash
# After changing schema.prisma
npx prisma migrate dev --name description_of_changes

# Generate Prisma Client
npx prisma generate

# View database in Prisma Studio
npx prisma studio
```

## 📁 Migration Files

Migrations are stored in `prisma/migrations/` directory. Each migration has:
- **migration.sql** - The SQL commands to execute
- **timestamp_name/** - Folder named with timestamp and description

## 🌱 Seeding

The seed script (`prisma/seed.js`) creates initial data:
- Master tenant
- Default branch  
- Landing settings
- Sample services
- Admin user (phone: `admin`, password: `123`)
- Professional user (phone: `pro`, password: `pro123`)

## ⚠️ Important Notes

1. **Never edit migration files manually** - Always create new migrations
2. **Always test migrations locally first**
3. **Backup production database before migrating**
4. **Migrations are applied in order** - Don't delete old migrations

## 🔄 Migration from Legacy initDB()

The old `initDB()` function in `server.js` is now **deprecated**.  
It will be removed in future versions. Use Prisma Migrate instead.

**Migration Path:**
1. ✅ Schema defined in `prisma/schema.prisma`
2. ✅ Seed data in `prisma/seed.js`
3. ⏳ Create initial migration: `npx prisma migrate dev --name init`
4. ⏳ Remove `initDB()` from `server.js`

## 🐛 Troubleshooting

### "Database is out of sync"
```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or apply pending migrations
npx prisma migrate deploy
```

### "Migration failed"
```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back migration_name

# Or mark as applied if it partially succeeded
npx prisma migrate resolve --applied migration_name
```

### "Can't reach database"
Check your `DATABASE_URL` in `.env` file.

## 📚 Resources

- [Prisma Migrate Docs](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [Seeding Database](https://www.prisma.io/docs/guides/database/seed-database)
