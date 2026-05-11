const fs = require('fs');
const path = require('path');

const workspace = process.cwd();
const publicDir = path.join(workspace, 'public');
const dirs = ['images', 'sup_images', 'tea&iced-cream'];

function listPublicFiles() {
  const files = [];
  for (const d of dirs) {
    const dirPath = path.join(publicDir, d);
    if (!fs.existsSync(dirPath)) continue;
    const entries = fs.readdirSync(dirPath);
    for (const e of entries) files.push(`/${d}/${e}`);
  }
  return files;
}

function parseResolverPaths(resolverSource) {
  const paths = new Set();
  const re = /["'](\/(?:images|sup_images|tea&iced-cream)\/[\w\-&\s\.@()!,%~]+?\.(?:jpg|jpeg|png))["']/gi;
  let m;
  while ((m = re.exec(resolverSource)) !== null) paths.add(m[1]);
  return Array.from(paths);
}

function parseExplicitKeys(resolverSource, mapName) {
  const re = new RegExp(`const\\s+${mapName}\\s*:\\s*Record[^=]+=\\s*\\{([\s\S]*?)\\}\s*;`, 'i');
  const match = resolverSource.match(re);
  if (!match) return [];
  const body = match[1];
  const keyRe = /"([^"]+)"\s*:/g;
  const keys = [];
  let m;
  while ((m = keyRe.exec(body)) !== null) keys.push(m[1]);
  return keys;
}

function parseCatalogTitles(catalogSource) {
  const titles = new Set();
  const re = /"title"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(catalogSource)) !== null) titles.add(m[1]);
  return Array.from(titles);
}

function run() {
  const resolverPath = path.join(workspace, 'src', 'lib', 'image-resolver.ts');
  const catalogPath = path.join(workspace, 'src', 'data', 'catalog.ts');
  if (!fs.existsSync(resolverPath) || !fs.existsSync(catalogPath)) {
    console.error('Missing resolver or catalog file.');
    process.exit(1);
  }

  const resolverSrc = fs.readFileSync(resolverPath, 'utf8');
  const catalogSrc = fs.readFileSync(catalogPath, 'utf8');

  const publicFiles = listPublicFiles();
  const resolverPaths = parseResolverPaths(resolverSrc);
  const menuKeys = parseExplicitKeys(resolverSrc, 'MENU_IMAGE_MAP');
  const productKeys = parseExplicitKeys(resolverSrc, 'PRODUCT_IMAGE_MAP');
  const gelatoKeys = parseExplicitKeys(resolverSrc, 'GELATO_IMAGE_MAP');
  const teaKeys = parseExplicitKeys(resolverSrc, 'TEA_IMAGE_MAP');

  const catalogTitles = parseCatalogTitles(catalogSrc);

  // duplicates: image path -> count
  const counts = {};
  for (const p of resolverPaths) counts[p] = (counts[p] || 0) + 1;

  const duplicates = Object.entries(counts).filter(([, c]) => c > 1).map(([p, c]) => ({ path: p, count: c }));

  const used = new Set(resolverPaths);
  const unused = publicFiles.filter((f) => !used.has(f));

  // missing mappings: titles not in explicit maps
  const normalized = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim();
  const explicitSet = new Set([...menuKeys, ...productKeys, ...gelatoKeys, ...teaKeys].map(normalized));
  const missing = catalogTitles.filter((t) => !explicitSet.has(normalized(t)));

  const report = {
    totalPublicFiles: publicFiles.length,
    resolverReferencedFiles: resolverPaths.length,
    duplicates,
    unusedAssets: unused,
    explicitMenuKeys: menuKeys.length,
    explicitProductKeys: productKeys.length,
    explicitGelatoKeys: gelatoKeys.length,
    explicitTeaKeys: teaKeys.length,
    missingExplicitMappingsSample: missing.slice(0, 50),
    missingCount: missing.length
  };

  const out = path.join(workspace, 'image-audit-report.json');
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log('Wrote', out);
}

run();
