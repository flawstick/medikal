"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { QrCode, Upload, CheckCircle, AlertCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"

export function UploadDeliveryForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    client_name: "",
    client_phone: "",
    address: "",
    packages_count: "",
    driver: "",
    car_number: "",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.address.trim()) {
      toast({
        title: "שגיאה",
        description: "כתובת היא שדה חובה",
        variant: "destructive",
      })
      return
    }

    if (!formData.packages_count || Number.parseInt(formData.packages_count) <= 0) {
      toast({
        title: "שגיאה",
        description: "מספר חבילות חייב להיות גדול מ-0",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_name: formData.client_name || null,
          client_phone: formData.client_phone || null,
          address: formData.address.trim(),
          packages_count: Number.parseInt(formData.packages_count),
          driver: formData.driver || null,
          car_number: formData.car_number || null,
        }),
      })

      if (response.ok) {
        const newOrder = await response.json()
        
        // Show success toast
        toast({
          title: "הצלחה!",
          description: `משלוח #${newOrder.id} נוצר בהצלחה`,
          variant: "default",
        })

        // Reset form
        setFormData({
          client_name: "",
          client_phone: "",
          address: "",
          packages_count: "",
          driver: "",
          car_number: "",
        })

        // Redirect to deliveries page after a short delay
        setTimeout(() => {
          router.push("/deliveries")
        }, 1500)
      } else {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to create order")
      }
    } catch (error) {
      console.error("Error creating order:", error)
      toast({
        title: "שגיאה",
        description: error instanceof Error ? error.message : "שגיאה ביצירת המשלוח",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const scanQRCode = () => {
    // Simulate QR code scan
    setFormData((prev) => ({ ...prev, driver: "יוסי כהן", car_number: "מדי-001" }))
  }

  return (
    <Card className="max-w-2xl mx-auto shadow-sm">
      <CardHeader>
        <CardTitle className="text-right">העלאת משלוח חדש</CardTitle>
        <CardDescription className="text-right">מלא את הפרטים להעלאת משלוח חדש למערכת</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client_name" className="text-right block">
                שם לקוח (אופציונלי)
              </Label>
              <Input
                id="client_name"
                value={formData.client_name}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_name: e.target.value }))}
                placeholder="הכנס שם לקוח"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="client_phone" className="text-right block">
                טלפון לקוח (אופציונלי)
              </Label>
              <Input
                id="client_phone"
                value={formData.client_phone}
                onChange={(e) => setFormData((prev) => ({ ...prev, client_phone: e.target.value }))}
                placeholder="הכנס מספר טלפון"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="packages_count" className="text-right block">
                מספר חבילות *
              </Label>
              <Input
                id="packages_count"
                type="number"
                min="1"
                required
                value={formData.packages_count}
                onChange={(e) => setFormData((prev) => ({ ...prev, packages_count: e.target.value }))}
                placeholder="הכנס מספר חבילות"
                className="text-right"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="driver" className="text-right block">
                נהג (אופציונלי)
              </Label>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="icon" onClick={scanQRCode}>
                  <QrCode className="h-4 w-4" />
                </Button>
                <Input
                  id="driver"
                  value={formData.driver}
                  onChange={(e) => setFormData((prev) => ({ ...prev, driver: e.target.value }))}
                  placeholder="בחר נהג"
                  className="text-right"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="car_number" className="text-right block">
                מספר רכב (אופציונלי)
              </Label>
              <Input
                id="car_number"
                value={formData.car_number}
                onChange={(e) => setFormData((prev) => ({ ...prev, car_number: e.target.value }))}
                placeholder="הכנס מספר רכב"
                className="text-right"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-right block">
              כתובת *
            </Label>
            <Textarea
              id="address"
              required
              value={formData.address}
              onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="הכנס כתובת מלאה"
              className="text-right"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            <Upload className="mr-2 h-4 w-4" />
            {loading ? "מעלה..." : "העלה משלוח"}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
