#!/usr/bin/env bash

# Hackmate Setup Script
# This script sets up the complete Hackmate platform

set -e

echo "🚀 Hackmate Setup Script"
echo "========================="
echo ""

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm not found"
    exit 1
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. You'll need to set up the database manually."
else
    echo "✅ PostgreSQL client found"
fi

echo "✅ Node.js and npm found"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f .env.local ]; then
    echo "📝 Creating .env.local file..."
    cp .env.local.example .env.local
    echo "⚠️  Please update .env.local with your configuration"
else
    echo "✅ .env.local already exists"
fi

echo ""
echo "📦 Installing dependencies..."
npm install

echo ""
echo "🔧 Setting up Prisma..."
npm run prisma:generate

echo ""
echo "🗄️  Setting up database..."
echo "Make sure PostgreSQL is running and DATABASE_URL is set correctly in .env.local"
npm run prisma:migrate:dev

echo ""
echo "✅ Setup Complete!"
echo ""
echo "📝 Next Steps:"
echo "1. Update .env.local with your OAuth credentials (GitHub, Google)"
echo "2. Configure SMTP settings for email"
echo "3. Run 'npm run dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "📚 Documentation:"
echo "- README.md - Project overview"
echo "- MIGRATION.md - Database management"
echo ""
