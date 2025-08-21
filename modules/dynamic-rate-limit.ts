// modules/dynamic-rate-limit.ts
// currently not using this script due to the complexity, but may revist at a later date.

import {
  CustomRateLimitDetails,
  ZuploRequest,
  ZuploContext,
} from "@zuplo/runtime";

export function getLimitFromMetadata(
  request: ZuploRequest,
  context: ZuploContext,
  policyName: string,
): CustomRateLimitDetails {
  // The 'require-api-key' policy runs first, so the consumer
  // details are available on the context object.
  //const consumer = request.user; //potentially mess with this later if it works
    
  if (request.user?.data.rateLimit) {
    // If the consumer has rate limit metadata, use it
    context.log.info(
      `Applying custom rate limit for consumer: ${request.user?.sub}`
    );
    return {
      key: request.user?.sub, // The unique identifier for this partner's rate limit bucket
      requestsAllowed: request.user?.data.rateLimit,
      timeWindowMinutes: 1,
    };
  }

  // Fallback for any requests that don't have a consumer or metadata
  context.log.warn(`No custom rate limit found, using fallback.`);
  return {
    key: request.ip, // Fallback to limiting by IP address
    requestsAllowed: 10, // A low, safe fallback limit
  };
}
