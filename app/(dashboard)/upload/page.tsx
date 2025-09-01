import { Suspense, lazy } from "react"
import { FormLoadingSkeleton } from "@/components/loading-states"

// Lazy load the heavy upload form
const UploadDeliveryForm = lazy(() => 
  import("@/components/upload-delivery-form").then(module => ({
    default: module.UploadDeliveryForm
  }))
)

export default function UploadPage() {
  return (
    <div className="h-full overflow-hidden">
      <Suspense fallback={<FormLoadingSkeleton />}>
        <UploadDeliveryForm />
      </Suspense>
    </div>
  )
}
