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
    
    const { spawn } = require('child_process');
    return new Promise((resolve, reject) => {
      const child = spawn('npx', ['prisma', 'generate'], { cwd: path.join(__dirname, '..'), shell: false });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        if (code !== 0) {
          console.error('Failed to generate Prisma client: Process exited with code', code);
          console.error('Stdout:', stdout);
          console.error('Stderr:', stderr);
          reject(new Error('Prisma generate failed'));
          return;
        }
        console.log('Prisma client generated successfully');
        console.log('Stdout:', stdout);
        resolve();
    // Start the main server
    const serverPath = path.join(__dirname, '..', 'dist', 'index.js');
    if (fs.existsSync(serverPath)) {
      await import(serverPath);
    } else {
      throw new Error(`Server entry point not found at ${serverPath}`);
    }
      child.on('error', (error) => {
        console.error('Failed to start Prisma generate process:', error);
        reject(error);
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