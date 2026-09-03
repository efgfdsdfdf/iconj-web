const fs = require('fs');
const path = require('path');
const glob = require('glob');

const adminApiPattern = path.join(process.cwd(), 'src/app/api/admin/**/*.ts');
const files = glob.sync(adminApiPattern.replace(/\\/g, '/'));

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes('verifyAdmin()') || content.includes('requireAdmin()')) {
    continue;
  }
  
  // Add import if missing
  if (!content.includes('verifyAdmin')) {
    content = `import { verifyAdmin } from "@/lib/auth/admin";\n` + content;
  }
  
  // Inject into GET
  if (content.includes('export async function GET(req: NextRequest) {') || content.includes('export async function GET(req: Request) {') || content.includes('export async function GET() {') || content.includes('export async function GET(req: NextRequest, { params }:')) {
    content = content.replace(
      /(export async function GET[^{]+\{\n(?:  try \{\n)?)/,
      `$1    const { isAdmin } = await verifyAdmin();\n    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });\n`
    );
  }
  
  // Inject into POST
  if (content.includes('export async function POST(req: NextRequest) {') || content.includes('export async function POST(req: Request) {') || content.includes('export async function POST() {') || content.includes('export async function POST(req: NextRequest, { params }:')) {
    content = content.replace(
      /(export async function POST[^{]+\{\n(?:  try \{\n)?)/,
      `$1    const { isAdmin } = await verifyAdmin();\n    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });\n`
    );
  }

  // Inject into PUT
  if (content.includes('export async function PUT(')) {
    content = content.replace(
      /(export async function PUT[^{]+\{\n(?:  try \{\n)?)/,
      `$1    const { isAdmin } = await verifyAdmin();\n    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });\n`
    );
  }

  // Inject into DELETE
  if (content.includes('export async function DELETE(')) {
    content = content.replace(
      /(export async function DELETE[^{]+\{\n(?:  try \{\n)?)/,
      `$1    const { isAdmin } = await verifyAdmin();\n    if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });\n`
    );
  }

  fs.writeFileSync(file, content);
  console.log(`Secured ${file}`);
}
