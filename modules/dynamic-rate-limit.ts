// modules/dynamic-rate-limit.ts
// currently not using this script due to the complexity, but may revist at a later date.

import {
  CustomRateLimitDetails,
  ZuploRequest,
  ZuploContext,
} from "@zuplo/runtime";

export function getLimitFromMetadata(
  request: ZuploRequest,
  context: ZuploContext
  policyName: string,
): CustomRateLimitDetails {
  // The 'require-api-key' policy runs first, so the consumer
  // details are available on the context object.
  const consumer = request.user;
  context.log.info(
    //if you can figure out how to properly call the consumer and the consumer's rate-limit policy from the metadata, this should work:
    `processing consumer '${consumer.sub}' for rate-limit policy '${policyName}'`,    
  );
  
  if (consumer.data.rateLimit) {
    // If the consumer has rate limit metadata, use it
    context.log.info(`Applying custom rate limit for consumer: ${consumer.subject}`);
    return {
      key: consumer.subject, // The unique identifier for this partner's rate limit bucket
      requestsAllowed: consumer.metadata.rateLimit.requestsPerMinute,
      // Note: The built-in policy does not support dynamic burst,
      // so we only override requestsAllowed. Burst will use the static
      // value from policies.json.
    };
  }

  // Fallback for any requests that don't have a consumer or metadata
  context.log.warn(`No custom rate limit found, using fallback.`);
  return {
    key: request.ip, // Fallback to limiting by IP address
    requestsAllowed: 10, // A low, safe fallback limit
  };
}
