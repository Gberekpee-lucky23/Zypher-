"use client"

import { useState } from "react"
import FileUpload from "./file-upload"
import { Button } from "@/components/ui/button"
import { Unlock, Download } from "lucide-react"
import { cryptoService } from "../../lib/crypto-service"

interface DecryptionPanelProps {
  setStatus: (status: { message: string; type: "idle" | "loading" | "success" | "error" }) => void
}

export default function DecryptionPanel({ setStatus }: DecryptionPanelProps) {
  const [encryptedFile, setEncryptedFile] = useState<File | null>(null)
  const [encryptedKeyFile, setEncryptedKeyFile] = useState<File | null>(null)
  const [privateKeyFile, setPrivateKeyFile] = useState<File | null>(null)
  const [decryptedFile, setDecryptedFile] = useState<Blob | null>(null)
  const [originalFileName, setOriginalFileName] = useState<string>("")

  const handleEncryptedFileSelect = (file: File) => {
    setEncryptedFile(file)
    // Try to extract original filename
    const nameParts = file.name.split(".")
    if (nameParts.length > 1 && nameParts[nameParts.length - 1] === "encrypted") {
      nameParts.pop()
      setOriginalFileName(nameParts.join("."))
    } else {
      setOriginalFileName("decrypted_file")
    }

    setStatus({
      message: `Encrypted file selected: ${file.name}`,
      type: "idle",
    })
  }

  const handleEncryptedKeySelect = (file: File) => {
    setEncryptedKeyFile(file)
    setStatus({
      message: `Encrypted key file selected: ${file.name}`,
      type: "idle",
    })
  }

  const handlePrivateKeySelect = (file: File) => {
    setPrivateKeyFile(file)
    setStatus({
      message: `Private key file selected: ${file.name}`,
      type: "idle",
    })
  }

  const handleDecrypt = async () => {
    if (!encryptedFile || !encryptedKeyFile || !privateKeyFile) {
      setStatus({
        message: "Please select all required files",
        type: "error",
      })
      return
    }

    try {
      setStatus({
        message: "Decrypting file...",
        type: "loading",
      })

      // Read the private key file
      const privateKeyText = await encryptedKeyFile.text()
      const encryptedKeyData = JSON.parse(privateKeyText)

      // Read the private key
      const privateKeyData = await privateKeyFile.text()
      const privateKey = await cryptoService.importPrivateKey(privateKeyData)

      // Decrypt the file
      const decrypted = await cryptoService.decryptFile(encryptedFile, encryptedKeyData, privateKey)

      setDecryptedFile(decrypted)

      setStatus({
        message: "File decrypted successfully!",
        type: "success",
      })
    } catch (error) {
      console.error("Decryption error:", error)
      setStatus({
        message: `Decryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      })
    }
  }

  const downloadDecryptedFile = () => {
    if (!decryptedFile) return

    const url = URL.createObjectURL(decryptedFile)
    const a = document.createElement("a")
    a.href = url
    a.download = originalFileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <FileUpload onFileSelect={handleEncryptedFileSelect} label="Select encrypted file" />

      <FileUpload onFileSelect={handleEncryptedKeySelect} accept=".json" label="Select encrypted key file" />

      <FileUpload onFileSelect={handlePrivateKeySelect} accept=".pem" label="Select private key file" />

      <Button
        onClick={handleDecrypt}
        disabled={!encryptedFile || !encryptedKeyFile || !privateKeyFile}
        className="w-full"
      >
        <Unlock className="mr-2 h-4 w-4" /> Decrypt File
      </Button>

      {decryptedFile && (
        <div className="mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium mb-3">Decryption Complete</h3>
          <Button onClick={downloadDecryptedFile} variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" /> Download Decrypted File
          </Button>
        </div>
      )}
    </div>
  )
}
