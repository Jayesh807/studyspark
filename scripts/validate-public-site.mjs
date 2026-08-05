import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const mode = process.argv[2] ?? "all";

const requiredRoutes = [
  "src/app/about/page.tsx",
  "src/app/contact/page.tsx",
  "src/app/editorial-policy/page.tsx",
  "src/app/disclaimer/page.tsx",
  "src/app/terms-and-conditions/page.tsx",
  "src/app/features/[slug]/page.tsx",
  "src/app/guides/page.tsx",
  "src/app/guides/[slug]/page.tsx",
  "src/app/guides/category/[category]/page.tsx",
];

const blockedSourcePatterns = [
  /AggregateRating/i,
  /ratingValue/i,
  /ratingCount/i,
  /join thousands/i,
  /Free forever/i,
  /Pro tier coming soon/i,
  /TESTIMONIALS/,
  /Satisfy Google AdSense/i,
  /3,000\+ words/i,
  /social proof/i,
  /userScalable/i,
  /maximumScale/i,
];

const noindexRoutes = [
  "/privacy-policy",
  "/terms",
  "/terms-and-conditions",
  "/cookie-policy",
  "/disclaimer",
  "/dashboard",
  "/api",
];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(root, relativePath));
}

function walk(dir) {
  return fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((entry) => {
    const relative = path.join(dir, entry.name).replaceAll("\\", "/");
    if (entry.isDirectory()) {
      return walk(relative);
    }
    return relative;
  });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function checkContent() {
  for (const route of requiredRoutes) {
    assert(exists(route), `Missing required public route: ${route}`);
  }

  const sourceFiles = walk("src").filter((file) => /\.(ts|tsx)$/.test(file));
  for (const file of sourceFiles) {
    const body = read(file);
    for (const pattern of blockedSourcePatterns) {
      assert(!pattern.test(body), `Blocked pattern ${pattern} found in ${file}`);
    }
  }
}

function checkLinks() {
  const nav = read("src/content/navigation.ts");
  for (const href of ["/features", "/guides", "/about", "/contact", "/editorial-policy"]) {
    assert(nav.includes(href), `Navigation registry missing ${href}`);
  }

  const sitemap = read("src/app/sitemap.ts");
  assert(sitemap.includes("INDEXABLE_FEATURES"), "Sitemap must include indexable feature registry");
  assert(sitemap.includes("REVIEWED_GUIDES"), "Sitemap must include reviewed guide registry");
}

function checkSitemap() {
  const sitemap = read("src/app/sitemap.ts");
  for (const route of noindexRoutes) {
    assert(!sitemap.includes(`"${route}"`) && !sitemap.includes(`'${route}'`), `Sitemap includes noindex route ${route}`);
  }
  assert(read("src/app/robots.ts").includes("/api/"), "robots.ts must disallow API routes");
}

function checkMetadata() {
  assert(!read("src/app/layout.tsx").includes("AggregateRating"), "layout must not emit aggregate ratings");
  assert(read("src/app/privacy-policy/page.tsx").includes("index: false"), "privacy policy must be noindex");
  assert(read("src/app/cookie-policy/page.tsx").includes("index: false"), "cookie policy must be noindex");
  assert(read("src/app/terms-and-conditions/page.tsx").includes("index: false"), "terms page must be noindex");
  assert(read("src/app/disclaimer/page.tsx").includes("index: false"), "disclaimer page must be noindex");
}

const checks = {
  content: checkContent,
  links: checkLinks,
  sitemap: checkSitemap,
  metadata: checkMetadata,
};

if (mode === "all") {
  Object.values(checks).forEach((check) => check());
} else {
  assert(checks[mode], `Unknown validation mode: ${mode}`);
  checks[mode]();
}

console.log(`validate-public-site:${mode} passed`);
