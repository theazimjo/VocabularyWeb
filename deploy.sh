#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "==========================================="
echo "🚀 Vocabry Deploy Bash Script Boshlandi..."
echo "==========================================="

# 1. Yangi kodlarni Git dan yuklab olish
echo "📦 1. Git'dan eng yangi kodlar olinmoqda (git pull)..."
git pull origin main

# 2. Docker Compose orqali tizimni qayta qurish va yurgizish
# Izoh: 'docker compose' (bo'sh joy bilan) yoki 'docker-compose' bo'lishi mumkin. 
# Agar sizda docker-compose bo'lsa shunga o'zgartiring.
echo "🐳 2. Tizim Docker orqali moslashtirilmoqda va ishga tushmoqda..."
docker compose up -d --build

# 3. Prisma orqali bazani sinxron qilish
# Izoh: db push yangi sxemalarni bazaga hechakat qoldirmasdan kiritadi
echo "🗄️ 3. Ma'lumotlar bazasi (Prisma) sinxron qilinmoqda..."
docker compose exec -T app npx prisma db push

# 4. Ortiqcha keraksiz (eski) Docker imagelarni tozalash (joyni tejash uchun)
echo "🧹 4. Tizimdagi ortiqcha Docker xotiralari tozalanmoqda..."
docker image prune -f

echo "==========================================="
echo "✅ DEPLOY MUAFFAQIYATLI YAKUNLANDI!"
echo "Ilova endi ishlab turibdi."
echo "==========================================="
