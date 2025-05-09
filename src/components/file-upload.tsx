"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Upload, type File } from "lucide-react"

interface FileUploadProps {
  onFileSelect: (file: File) => void
  accept?: string
  label: string
}

export default function FileUpload({ onFileSelect, accept = "*", label }: FileUploadProps) {
  const [fileName, setFileName] = useState<string>("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const file = files[0]
      setFileName(file.name)
      onFileSelect(file)
    }
  }

  const handleButtonClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <div className="flex items-center gap-2">
        <Input ref={fileInputRef} type="file" accept={accept} onChange={handleFileChange} className="hidden" />
        <Button onClick={handleButtonClick} variant="outline" className="w-full flex items-center gap-2">
          <Upload size={16} />
          {fileName ? fileName : "Select file"}
        </Button>
      </div>
    </div>
  )
}
