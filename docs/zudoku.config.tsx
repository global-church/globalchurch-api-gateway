import type { ZudokuConfig } from "zudoku";

/**
 * Developer Portal Configuration
 * For more information, see:
 * https://zuplo.com/docs/dev-portal/zudoku/configuration/overview
 */
const config: ZudokuConfig = {
  site: {
    title: "Global.Church Developer Portal",
    logo: {
      src: {
        light: "/gc-logo.png",
        dark: "/gc-logo.png",
      },
    },
  },
  metadata: {
    title: "Global.Church Developer Portal",
    description: "Global.Church API documentation and developer playground site",
  },
  topNavigation: [
    { id: "docs", label: "Documentation" },
    { id: "api", label: "API Reference" },
  ],
  sidebar: {
    docs: [
      {
        type: "category",
        label: "Getting Started",
        icon: "sparkles",
        items: [
          { type: "doc", id: "guides/what-is-global-church" },
          { type: "doc", id: "guides/key-concepts" },
          { type: "doc", id: "guides/get-an-api-key" },
        ],
      },
      {
        type: "category",
        label: "For App Developers",
        icon: "code",
        items: [
          { type: "link", label: "API Reference", href: "/api" },
          { type: "doc", id: "guides/developers/sparql-quickstart" },
          { type: "doc", id: "guides/developers/data-modeling-cookbook" },
          { type: "doc", id: "guides/developers/contributing-linked-data" },
          { type: "doc", id: "guides/developers/mcp-integration" },
        ],
      },
      {
        type: "category",
        label: "For Data Managers",
        icon: "database",
        items: [
          { type: "doc", id: "guides/data-managers/knowledge-graph-overview" },
          { type: "doc", id: "guides/data-managers/data-quality-shacl" },
          { type: "doc", id: "guides/data-managers/reviewing-claims" },
          { type: "doc", id: "guides/data-managers/adding-a-country" },
        ],
      },
      {
        type: "category",
        label: "Reference",
        icon: "book-open",
        items: [
          { type: "link", label: "Ontology Reference", href: "https://ontology.global.church" },
          { type: "link", label: "SKOS Vocabularies", href: "https://ontology.global.church/vocabs" },
          { type: "doc", id: "guides/reference/named-graph-conventions" },
          { type: "doc", id: "guides/reference/uri-patterns" },
          { type: "doc", id: "guides/reference/his-registries" },
        ],
      },
    ],
  },
  docs: {
    files: "/pages/**/*.mdx",
  },
  apis: [
    {
      type: "file",
      input: "../config/routes.oas.json",
      path: "api",
    },
  ],
  // TODO: Configure Privy authentication
  // authentication: {
  //   type: "auth0",
  //   domain: "auth.zuplo.site",
  //   clientId: "f8I87rdsCRo4nU2FHf0fHVwA9P7xi7Ml",
  //   audience: "https://api.example.com/",
  // },
  redirects: [
    { from: "/", to: "/guides/what-is-global-church" },
  ],
  apiKeys: {
    enabled: true,
  },
};

export default config;
