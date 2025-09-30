#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

async function debugPrismaSetup() {
  console.log('=== Prisma Debug Information ===');
  console.log('Node.js version:', process.version);
  console.log('Platform:', process.platform);
  console.log('Architecture:', process.arch);
  console.log('Current working directory:', process.cwd());
  console.log('Environment:', process.env.NODE_ENV || 'development');
  
  const nodeModulesPath = path.join(__dirname, '..', 'node_modules');
  const prismaClientPath = path.join(nodeModulesPath, '.prisma');
  const prismaClientClientPath = path.join(prismaClientPath, 'client');
  
  console.log('Node modules path exists:', fs.existsSync(nodeModulesPath));
  console.log('Prisma client path exists:', fs.existsSync(prismaClientPath));
  console.log('Prisma client/client path exists:', fs.existsSync(prismaClientClientPath));
  
  if (fs.existsSync(prismaClientPath)) {
    try {
      const contents = fs.readdirSync(prismaClientPath);
      console.log('Contents of .prisma directory:', contents);
    } catch (error) {
      console.error('Error reading .prisma directory:', error.message);
    }
  }
  
  // Check if DATABASE_URL is set
  console.log('DATABASE_URL is set:', !!process.env.DATABASE_URL);
  console.log('================================');
}

async function ensurePrismaClient() {
  const prismaClientPath = path.join(__dirname, '..', 'node_modules', '.prisma');
  
  // Check if Prisma client exists
  if (!fs.existsSync(prismaClientPath)) {
    console.log('Prisma client not found, generating...');
    
    return new Promise((resolve, reject) => {
      exec('npx prisma generate', { cwd: path.join(__dirname, '..') }, (error, stdout, stderr) => {
        if (error) {
          console.error('Failed to generate Prisma client:', error);
          console.error('Stdout:', stdout);
          console.error('Stderr:', stderr);
          reject(error);
          return;
        }
        console.log('Prisma client generated successfully');
        console.log('Stdout:', stdout);
        resolve();
      });
    });
  }
  
  console.log('Prisma client found');
}

async function startServer() {
  try {
    await debugPrismaSetup();
    await ensurePrismaClient();
    
    console.log('Starting main server...');
    
    // Start the main server
    require('../dist/index.js');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();