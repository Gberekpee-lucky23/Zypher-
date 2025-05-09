/**
 * Cryptographic Layer
 * Handles all cryptographic operations using Web Crypto API
 */

// Helper function to convert ArrayBuffer to base64 string
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ""
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i])
  }
  return btoa(binary)
}

// Helper function to convert base64 string to ArrayBuffer
function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return bytes.buffer
}

// Main cryptographic service
export const cryptoService = {
  // Generate RSA key pair for asymmetric encryption
  async generateRSAKeyPair(): Promise<{ publicKey: CryptoKey; privateKey: CryptoKey }> {
    const keyPair = await window.crypto.subtle.generateKey(
      {
        name: "RSA-OAEP",
        modulusLength: 2048,
        publicExponent: new Uint8Array([1, 0, 1]),
        hash: "SHA-256",
      },
      true,
      ["encrypt", "decrypt"],
    )

    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey,
    }
  },

  // Generate AES key for symmetric encryption
  async generateAESKey(): Promise<CryptoKey> {
    return await window.crypto.subtle.generateKey(
      {
        name: "AES-GCM",
        length: 256,
      },
      true,
      ["encrypt", "decrypt"],
    )
  },

  // Export a key to PEM format
  async exportKey(key: CryptoKey): Promise<string> {
    const exported = await window.crypto.subtle.exportKey(key.type === "private" ? "pkcs8" : "spki", key)

    const base64 = arrayBufferToBase64(exported)
    const pemType = key.type === "private" ? "PRIVATE" : "PUBLIC"

    return `-----BEGIN ${pemType} KEY-----\n${base64}\n-----END ${pemType} KEY-----`
  },

  // Import a private key from PEM format
  async importPrivateKey(pemKey: string): Promise<CryptoKey> {
    // Remove PEM header and footer and whitespace
    const base64 = pemKey
      .replace(/-----BEGIN PRIVATE KEY-----/, "")
      .replace(/-----END PRIVATE KEY-----/, "")
      .replace(/\s/g, "")

    const binaryDer = base64ToArrayBuffer(base64)

    return await window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["decrypt"],
    )
  },

  // Encrypt a file using AES-GCM and protect the key with RSA
  async encryptFile(file: File, publicKey: CryptoKey): Promise<{ encryptedFile: Blob; encryptedKey: string }> {
    // Generate a random IV (Initialization Vector)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))

    // Generate a new AES key for this file
    const aesKey = await this.generateAESKey()

    // Read the file
    const fileBuffer = await file.arrayBuffer()

    // Encrypt the file with AES-GCM
    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      fileBuffer,
    )

    // Export the AES key
    const exportedAesKey = await window.crypto.subtle.exportKey("raw", aesKey)

    // Encrypt the AES key with the RSA public key
    const encryptedAesKey = await window.crypto.subtle.encrypt(
      {
        name: "RSA-OAEP",
      },
      publicKey,
      exportedAesKey,
    )

    // Combine IV and encrypted content
    const encryptedFileData = new Uint8Array(iv.length + encryptedContent.byteLength)
    encryptedFileData.set(iv, 0)
    encryptedFileData.set(new Uint8Array(encryptedContent), iv.length)

    // Create a Blob from the encrypted data
    const encryptedFile = new Blob([encryptedFileData], { type: "application/octet-stream" })

    // Create a JSON object with the encrypted AES key
    const encryptedKeyJson = JSON.stringify({
      encryptedKey: arrayBufferToBase64(encryptedAesKey),
      algorithm: "RSA-OAEP",
      aesAlgorithm: "AES-GCM",
      keyLength: 256,
    })

    return {
      encryptedFile,
      encryptedKey: encryptedKeyJson,
    }
  },

  // Decrypt a file using the private key and encrypted AES key
  async decryptFile(
    encryptedFile: File,
    encryptedKeyData: { encryptedKey: string },
    privateKey: CryptoKey,
  ): Promise<Blob> {
    // Read the encrypted file
    const encryptedFileBuffer = await encryptedFile.arrayBuffer()
    const encryptedFileArray = new Uint8Array(encryptedFileBuffer)

    // Extract IV (first 12 bytes) and encrypted content
    const iv = encryptedFileArray.slice(0, 12)
    const encryptedContent = encryptedFileArray.slice(12)

    // Decrypt the AES key with the private key
    const encryptedAesKeyBuffer = base64ToArrayBuffer(encryptedKeyData.encryptedKey)
    const aesKeyBuffer = await window.crypto.subtle.decrypt(
      {
        name: "RSA-OAEP",
      },
      privateKey,
      encryptedAesKeyBuffer,
    )

    // Import the decrypted AES key
    const aesKey = await window.crypto.subtle.importKey(
      "raw",
      aesKeyBuffer,
      {
        name: "AES-GCM",
        length: 256,
      },
      false,
      ["decrypt"],
    )

    // Decrypt the file content with the AES key
    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv,
      },
      aesKey,
      encryptedContent,
    )

    // Create a Blob from the decrypted data
    return new Blob([decryptedContent])
  },
}
