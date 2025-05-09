"use client"

import { useState } from "react"
import FileUpload from "./file-upload"
import { Button } from "@/components/ui/button"
import { Lock, Download } from "lucide-react"
import { cryptoService } from "../../lib/crypto-service"

interface EncryptionPanelProps {
  setStatus: (status: { message: string; type: "idle" | "loading" | "success" | "error" }) => void
}

export default function EncryptionPanel({ setStatus }: EncryptionPanelProps) {
  const [file, setFile] = useState<File | null>(null)
  const [encryptedData, setEncryptedData] = useState<{
    encryptedFile: Blob | null
    encryptedKey: string | null
    publicKey: string | null
    privateKey: string | null
  }>({
    encryptedFile: null,
    encryptedKey: null,
    publicKey: null,
    privateKey: null,
  })

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    setEncryptedData({
      encryptedFile: null,
      encryptedKey: null,
      publicKey: null,
      privateKey: null,
    })
    setStatus({
      message: `File "${selectedFile.name}" selected (${(selectedFile.size / 1024).toFixed(2)} KB)`,
      type: "idle",
    })
  }

  const handleEncrypt = async () => {
    if (!file) {
      setStatus({
        message: "Please select a file to encrypt",
        type: "error",
      })
      return
    }

    try {
      setStatus({
        message: "Generating keys and encrypting file...",
        type: "loading",
      })

      // Generate RSA key pair
      const { publicKey, privateKey } = await cryptoService.generateRSAKeyPair()

      // Generate AES key and encrypt file
      const { encryptedFile, encryptedKey } = await cryptoService.encryptFile(file, publicKey)

      setEncryptedData({
        encryptedFile,
        encryptedKey,
        publicKey: await cryptoService.exportKey(publicKey),
        privateKey: await cryptoService.exportKey(privateKey),
      })

      setStatus({
        message: "File encrypted successfully! Download the encrypted file and keys.",
        type: "success",
      })
    } catch (error) {
      console.error("Encryption error:", error)
      setStatus({
        message: `Encryption failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        type: "error",
      })
    }
  }

  const downloadFile = (data: Blob | string, filename: string) => {
    const blob = typeof data === "string" ? new Blob([data], { type: "text/plain" }) : data
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6">
      <FileUpload onFileSelect={handleFileSelect} label="Select a file to encrypt" />

      <Button onClick={handleEncrypt} disabled={!file} className="w-full">
        <Lock className="mr-2 h-4 w-4" /> Encrypt File
      </Button>

      {encryptedData.encryptedFile && (
        <div className="space-y-4 mt-6 p-4 border rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="font-medium">Download Encrypted Files</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => downloadFile(encryptedData.encryptedFile!, `${file!.name}.encrypted`)}
            >
              <Download className="mr-2 h-4 w-4" /> Encrypted File
            </Button>
            <Button variant="outline" onClick={() => downloadFile(encryptedData.encryptedKey!, "encrypted_key.json")}>
              <Download className="mr-2 h-4 w-4" /> Encrypted Key
            </Button>
            <Button variant="outline" onClick={() => downloadFile(encryptedData.publicKey!, "public_key.pem")}>
              <Download className="mr-2 h-4 w-4" /> Public Key
            </Button>
            <Button variant="outline" onClick={() => downloadFile(encryptedData.privateKey!, "private_key.pem")}>
              <Download className="mr-2 h-4 w-4" /> Private Key
            </Button>
          </div>
          <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
            <strong>Important:</strong> Store your private key securely. You will need it to decrypt the file.
          </p>
        </div>
      )}
    </div>
  )
}
