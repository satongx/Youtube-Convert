import { NextResponse } from 'next/server'

// In a real application, you'd want to use a proper state management solution
let conversionProgress = {
  progress: 0,
  status: ''
}

export function GET() {
  return NextResponse.json(conversionProgress)
}

// Export for use in convert route
export function updateProgress(progress: number, status: string) {
  conversionProgress = { progress, status }
} 