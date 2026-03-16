#!/usr/bin/env node
/**
 * Setup script - initializes DB, creates upload/output dirs
 * Run: node scripts/setup.js
 */

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('\n🚀 Setting up ATS Resume Tailor...\n')

// 1. Check .env exists
if (!fs.existsSync('.env')) {
  console.log('📋 Creating .env from .env.example...')
  fs.copyFileSync('.env.example', '.env')
  console.log('   ✅ .env created — please edit it with your API keys\n')
} else {
  console.log('✅ .env already exists\n')
}

// 2. Create required directories
const dirs = ['./uploads', './outputs', './prisma']
dirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
    console.log(`📁 Created directory: ${dir}`)
  }
})

// 3. Generate Prisma client
console.log('\n📦 Generating Prisma client...')
try {
  execSync('npx prisma generate', { stdio: 'inherit' })
} catch (e) {
  console.error('❌ Prisma generate failed:', e.message)
}

// 4. Push database schema
console.log('\n🗄️  Pushing database schema...')
try {
  execSync('npx prisma db push', { stdio: 'inherit' })
  console.log('✅ Database ready\n')
} catch (e) {
  console.error('❌ DB push failed:', e.message)
}

// 5. Check pdflatex
console.log('🔧 Checking pdflatex...')
try {
  execSync('which pdflatex', { stdio: 'pipe' })
  console.log('✅ pdflatex found — PDF generation enabled\n')
} catch {
  console.log('⚠️  pdflatex not found — PDF generation disabled')
  console.log('   Install with: sudo apt-get install texlive-full\n')
}

console.log('🎉 Setup complete! Run: npm run dev\n')
