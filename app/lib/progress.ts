export let conversionProgress = {
  progress: 0,
  status: ''
}

export function updateProgress(progress: number, status: string) {
  conversionProgress = { progress, status }
} 