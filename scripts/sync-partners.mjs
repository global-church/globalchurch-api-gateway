// scripts/sync-partners.mjs
import fs from 'fs';
import yaml from 'js-yaml';

// Get the Zuplo API key from the environment variables
const ZUPLO_API_KEY = process.env.ZUPLO_API_KEY;
const ZUPLO_BUCKET_ID_PRODUCTION = process.env.ZUPLO_BUCKET_ID_PRODUCTION;
const ZUPLO_ACCOUNT_NAME = process.env.ZUPLO_ACCOUNT_NAME;

if (!ZUPLO_API_KEY || !ZUPLO_BUCKET_ID_PRODUCTION || !ZUPLO_ACCOUNT_NAME) {
  console.error('Error: ZUPLO_API_KEY, ZUPLO_BUCKET_ID_PRODUCTION, or ZUPLO_ACCOUNT_NAME environment variables are not set.');
  process.exit(1);
}

// Construct the correct API endpoint URL
const API_URL = `https://dev.zuplo.com/v1/accounts/${ZUPLO_ACCOUNT_NAME}/key-buckets/${ZUPLO_BUCKET_ID_PRODUCTION}/consumers?with-api-key=true`;

async function syncPartners() {
  try {
    // Load and parse the partners.yaml file
    const fileContents = fs.readFileSync('config/partners.yaml', 'utf8');
    const partnersData = yaml.load(fileContents);
    const partners = partnersData.partners;

    if (!partners || partners.length === 0) {
      console.log('No partners found in config/partners.yaml. Exiting.');
      return;
    }

    console.log(`Found ${partners.length} partner(s). Syncing with Zuplo...`);

    // Loop through each partner defined in the YAML file
    for (const partner of partners) {
      // Convert the array of tags from YAML into an object for the API
      const partnerTags = partner.tags ? partner.tags.reduce((acc, tag) => {
        acc[tag] = "true";
        return acc;
      }, {}) : {};
      
      const consumerData = {
        name: partner.subject,
        description: partner.displayName,
        managers: [partner.contactEmail],
        metadata: {
          ...partner.rateLimit,
          plan: partner.plan,
        },
        tags: {
          source: 'gitops',
          ...partnerTags,
        },
      };

      // Use the Zuplo Management API to create/update the consumer
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Authenticate with the API Key
          authorization: `Bearer ${ZUPLO_API_KEY}`,
        },
        body: JSON.stringify(consumerData),
      });

      if (!response.ok) {
        // If the API call fails, log the error
        const errorBody = await response.text();
        console.error(`Error syncing partner "${partner.subject}": ${response.status} ${response.statusText}`);
        console.error('Response body:', errorBody);
        // Optional: exit with an error code to fail the GitHub Action
        // process.exit(1);
      } else {
        console.log(`Successfully synced partner "${partner.subject}".`);
      }
    }
    console.log('Partner sync complete!');
  } catch (error) {
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

syncPartners();
