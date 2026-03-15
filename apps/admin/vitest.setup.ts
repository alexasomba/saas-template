// import { config } from 'dotenv'
// import path from 'path'

// config({ path: path.resolve(process.cwd(), '.env.local'), override: true })
// config()

if (!process.env.PAYLOAD_SECRET) {
  process.env.PAYLOAD_SECRET = "test-secret";
}
(globalThis as any).PAYLOAD_SECRET = process.env.PAYLOAD_SECRET;

if (!process.env.STRIPE_SECRET_KEY) {
  process.env.STRIPE_SECRET_KEY = "sk_test_mock";
}
(globalThis as any).STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Redirect console.log to console.error for visibility in some restricted environments if needed
// const originalLog = console.log
// console.log = (...args) => console.error('[DEBUG-LOG]', ...args)
