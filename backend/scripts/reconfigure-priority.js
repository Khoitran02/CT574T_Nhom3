import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Reconfigure Replica Set Priorities
 * 
 * Usage:
 *   node scripts/reconfigure-priority.js                    # Auto-detect environment
 *   node scripts/reconfigure-priority.js --env=local        # Force local
 *   node scripts/reconfigure-priority.js --env=production   # Force production
 */

// Detect environment from command-line arguments or .env
const args = process.argv.slice(2);
const envArg = args.find(arg => arg.startsWith('--env='));
const environment = envArg 
  ? envArg.split('=')[1] 
  : (process.env.MONGO_URI?.includes('localhost') ? 'local' : 'production');

// Environment-specific configurations
const environments = {
  local: {
    name: 'Local Development',
    replicaSets: [
      { name: 'configrs', host: 'localhost', port: 27019 },
      { name: 'shard1rs', host: 'localhost', port: 27022 },
      { name: 'shard2rs', host: 'localhost', port: 27025 },
      { name: 'shard3rs', host: 'localhost', port: 27028 }
    ]
  },
  production: {
    name: 'Production (4 Máy)',
    replicaSets: [
      { name: 'configrs', host: 'DESKTOP-0LH5AR4', port: 27019 },
      { name: 'shard1rs', host: 'DESKTOP-0LH5AR4', port: 27022 },
      { name: 'shard2rs', host: 'DESKTOP-0LH5AR4', port: 27025 },
      { name: 'shard3rs', host: 'DESKTOP-0LH5AR4', port: 27028 }
    ]
  }
};

const config = environments[environment];

if (!config) {
  console.error(`❌ Invalid environment: ${environment}`);
  console.error('Valid options: local, production');
  process.exit(1);
}

async function reconfigurePriority(rsConfig) {
  const uri = `mongodb://${rsConfig.host}:${rsConfig.port}/?directConnection=true`;
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const admin = client.db('admin');
    
    console.log(`\n🔧 Reconfiguring ${rsConfig.name}...`);
    
    // Get current config
    const status = await admin.command({ replSetGetConfig: 1 });
    const cfg = status.config;
    
    // Check if already configured
    const currentPriorities = cfg.members.map(m => m.priority || 1);
    if (currentPriorities[0] === 2 && currentPriorities[1] === 1 && currentPriorities[2] === 1) {
      console.log(`  ℹ️  ${rsConfig.name} already has correct priorities (2, 1, 1)`);
      return;
    }
    
    console.log(`  Current priorities: [${currentPriorities.join(', ')}]`);
    
    // Set priorities
    cfg.members[0].priority = 2;  // Node 1 preferred Primary
    cfg.members[1].priority = 1;  // Node 2 Secondary
    cfg.members[2].priority = 1;  // Node 3 Secondary
    
    // Increment version (required for reconfig)
    cfg.version += 1;
    
    // Apply
    await admin.command({ replSetReconfig: cfg });
    console.log(`  ✅ ${rsConfig.name} reconfigured: [2, 1, 1]`);
    
  } catch (error) {
    if (error.message.includes('not master')) {
      console.error(`  ⚠️  ${rsConfig.name}: Not connected to Primary. Try connecting to current Primary.`);
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error(`  ❌ ${rsConfig.name}: Cannot connect to ${rsConfig.host}:${rsConfig.port}`);
    } else {
      console.error(`  ❌ Error: ${error.message}`);
    }
  } finally {
    await client.close();
  }
}

async function main() {
  console.log('═'.repeat(70));
  console.log('  Reconfigure Replica Set Priorities');
  console.log('═'.repeat(70));
  console.log(`\n📍 Environment: ${config.name} (${environment})`);
  console.log(`\n📋 Replica Sets to reconfigure:`);
  config.replicaSets.forEach(rs => {
    console.log(`   - ${rs.name.padEnd(10)} → ${rs.host}:${rs.port}`);
  });
  console.log('\n' + '─'.repeat(70));
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (const rs of config.replicaSets) {
    try {
      const result = await reconfigurePriority(rs);
      if (result === 'skip') {
        skipCount++;
      } else {
        successCount++;
      }
    } catch (error) {
      errorCount++;
    }
    
    // Wait between reconfigs to allow election to complete
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
  
  console.log('\n' + '═'.repeat(70));
  console.log('  Summary');
  console.log('═'.repeat(70));
  console.log(`  ✅ Reconfigured: ${successCount}`);
  console.log(`  ℹ️  Already configured: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log('\n💡 Note: Primary election may take 10-15 seconds after reconfiguration.');
  console.log('    Use `rs.status()` to verify the new Primary.\n');
}

main();