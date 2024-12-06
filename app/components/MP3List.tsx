import { Music } from 'lucide-react'

export function MP3List({ files }: { files: string[] }) {
  if (!files.length) {
    return (
      <div className="text-center text-gray-500 py-8">
        No converted files yet
      </div>
    )
  }

  return (
    <ul className="divide-y divide-gray-200">
      {files.map((file, index) => (
        <li key={index} className="py-3 flex items-center space-x-3">
          <Music className="w-5 h-5 text-blue-500" />
          <span className="text-gray-700">{file}</span>
        </li>
      ))}
    </ul>
  )
} 