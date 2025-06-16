import { UploadDeliveryForm } from "@/components/upload-delivery-form"

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div className="text-right">
        <h1 className="text-3xl font-bold tracking-tight">העלאת משלוח</h1>
        <p className="text-muted-foreground mt-1">הוסף משלוח חדש למערכת</p>
      </div>

      {/* UploadDeliveryForm already renders a Card, ensure it gets shadow-sm if not globally applied */}
      {/* If Card in UploadDeliveryForm doesn't pick up global .card style, add className="shadow-sm" to it */}
      <UploadDeliveryForm />
    </div>
  )
}
