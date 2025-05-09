import { useState } from "react"
import EncryptionPanel from "./components/encryption-panel"
import DecryptionPanel from "./components/decryption-panel"
import StatusDisplay from "./components/status-display"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./components/ui/card"
import "./App.css"

function App() {
  const [status, setStatus] = useState<{
    message: string
    type: "idle" | "loading" | "success" | "error"
  }>({
    message: "Ready to encrypt or decrypt files",
    type: "idle",
  })

  return (
    <main className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-3xl shadow-lg">
        <CardHeader className="text-center bg-gradient-to-r from-purple-700 to-blue-700 text-white rounded-t-lg py-5">
          <CardTitle className="text-2xl font-bold py-1.5">Zypher</CardTitle>
          <CardDescription className="text-gray-100">
            Encrypt and decrypt your files with AES and RSA encryption
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Tabs defaultValue="encrypt" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="encrypt">Encrypt</TabsTrigger>
              <TabsTrigger value="decrypt">Decrypt</TabsTrigger>
            </TabsList>
            <TabsContent value="encrypt">
              <EncryptionPanel setStatus={setStatus} />
            </TabsContent>
            <TabsContent value="decrypt">
              <DecryptionPanel setStatus={setStatus} />
            </TabsContent>
          </Tabs>

          <StatusDisplay status={status} />
        </CardContent>
      </Card>
    </main>
  )
}

export default App