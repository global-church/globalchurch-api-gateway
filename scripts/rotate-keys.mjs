// scripts/rotate-keys.mjs
import fs from 'fs';
import yaml from 'js-yaml';

// Get all required variables from the environment
const { ZUPLO_API_KEY, ZUPLO_BUCKET_ID_PRODUCTION, ZUPLO_ACCOUNT_NAME } = process.env;

if (!ZUPLO_API_KEY || !ZUPLO_BUCKET_ID_PRODUCTION || !ZUPLO_ACCOUNT_NAME) {
  console.error('Error: Required environment variables are not set.');
  process.exit(1);
}

// Helper function to parse durations like "90d" or "7d" into milliseconds
function parseDuration(durationStr) {
  const durationRegex = /^(\d+)([d])$/; // d for days
  const match = durationStr.match(durationRegex);
  if (!match) {
    throw new Error(`Invalid duration format: ${durationStr}. Only 'd' for days is supported.`);
  }
  const value = parseInt(match[1], 10);
  const unit = match[2];

  switch (unit) {
    case 'd':
      return value * 24 * 60 * 60 * 1000; // days to milliseconds
    default:
      throw new Error(`Unsupported duration unit: ${unit}`);
  }
}

async function rotateExpiredKeys() {
  try {
    // 1. Load the local partner configuration from the YAML file
    const fileContents = fs.readFileSync('config/partners.yaml', 'utf8');
    const partnersData = yaml.load(fileContents);
    const localPartners = partnersData.partners.reduce((map, partner) => {
      map[partner.subject] = partner;
      return map;
    }, {});

    // 2. Fetch all consumers from the Zuplo API
    const consumersApiUrl = `https://dev.zuplo.com/v1/accounts/${ZUPLO_ACCOUNT_NAME}/key-buckets/${ZUPLO_BUCKET_ID_PRODUCTION}/consumers?include-api-keys=true`;
    const response = await fetch(consumersApiUrl, {
      headers: { authorization: `Bearer ${ZUPLO_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch consumers: ${response.statusText}`);
    }

    const { data: consumers } = await response.json();
    console.log(`Found ${consumers.length} consumers. Checking for keys to rotate...`);

    // 3. Check each consumer's keys
    for (const consumer of consumers) {
      const partnerConfig = localPartners[consumer.name];

      if (!partnerConfig || !partnerConfig.rotate) {
        console.log(`- Skipping consumer "${consumer.name}" (no rotation policy found).`);
        continue;
      }

      // Find the most recent, non-expiring key.
      const activeKey = consumer.apiKeys
        .filter(k => !k.expiresOn)
        .sort((a, b) => new Date(b.createdOn) - new Date(a.createdOn))[0];

      if (!activeKey) {
        console.log(`- Skipping consumer "${consumer.name}" (no active key found).`);
        continue;
      }

      const lifecycleMs = parseDuration(partnerConfig.rotate.lifecycle);
      const keyAgeMs = Date.now() - new Date(activeKey.createdOn).getTime();

      if (keyAgeMs > lifecycleMs) {
        console.log(`- Rotating key for "${consumer.name}". Key is ${Math.floor(keyAgeMs / (1000 * 60 * 60 * 24))} days old.`);

        // 4. If a key is expired, call the roll endpoint
        const overlapWindow = partnerConfig.rotate.overlapWindow;
        const rollApiUrl = `https://dev.zuplo.com/v1/accounts/${ZUPLO_ACCOUNT_NAME}/key-buckets/${ZUPLO_BUCKET_ID_PRODUCTION}/consumers/${consumer.name}/roll-key`;

        const rollResponse = await fetch(rollApiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            authorization: `Bearer ${ZUPLO_API_KEY}`,
          },
          body: JSON.stringify({
            // The overlap window tells Zuplo when to expire the old key
            previousKeyExpiresIn: overlapWindow,
          }),
        });

        if (!rollResponse.ok) {
          console.error(`  Error rolling key for "${consumer.name}": ${await rollResponse.text()}`);
        } else {
          console.log(`  Successfully rolled key for "${consumer.name}".`);
        }
      } else {
        console.log(`- Key for "${consumer.name}" is still valid.`);
      }
    }
    console.log('Key rotation check complete!');
  } catch (error) {
    console.error('An unexpected error occurred during key rotation:', error);
    process.exit(1);
  }
}

rotateExpiredKeys();
