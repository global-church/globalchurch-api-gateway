// modules/dynamic-rate-limit.ts
import {
  CustomRateLimitDetails,
  ZuploRequest,
  ZuploContext,
} from "@zuplo/runtime";

export function getLimitFromMetadata(
  request: ZuploRequest,
  context: ZuploContext
): CustomRateLimitDetails {
  // The 'require-api-key' policy runs first, so the consumer
  // details are available on the context object.
  const consumer = context.consumer;

  if (consumer?.metadata?.rateLimit) {
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
