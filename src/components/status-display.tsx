import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, Clock, Info } from "lucide-react"
import { cn } from "@/lib/utils"

interface StatusDisplayProps {
  status: {
    message: string
    type: "idle" | "loading" | "success" | "error"
  }
}

export default function StatusDisplay({ status }: StatusDisplayProps) {
  const getIcon = () => {
    switch (status.type) {
      case "idle":
        return <Info className="h-4 w-4" />
      case "loading":
        return <Clock className="h-4 w-4 animate-pulse" />
      case "success":
        return <CheckCircle className="h-4 w-4" />
      case "error":
        return <AlertCircle className="h-4 w-4" />
    }
  }

  const getAlertVariant = () => {
    switch (status.type) {
      case "idle":
        return "default"
      case "loading":
        return "default"
      case "success":
        return "success"
      case "error":
        return "destructive"
    }
  }

  return (
    <Alert
      variant={getAlertVariant() as any}
      className={cn(
        "mt-6",
        status.type === "success" && "bg-green-50 text-green-800 border-green-200",
        status.type === "error" && "bg-red-50 text-red-800 border-red-200",
        status.type === "loading" && "bg-blue-50 text-blue-800 border-blue-200",
      )}
    >
      <div className="flex items-center gap-2">
        {getIcon()}
        <AlertTitle>
          {status.type === "idle" && "Ready"}
          {status.type === "loading" && "Processing"}
          {status.type === "success" && "Success"}
          {status.type === "error" && "Error"}
        </AlertTitle>
      </div>
      <AlertDescription className="mt-1">{status.message}</AlertDescription>
    </Alert>
  )
}
