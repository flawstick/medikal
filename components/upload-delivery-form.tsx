"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Upload, CheckCircle, AlertCircle, FileSpreadsheet, FileText, Edit, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { useToast } from "@/hooks/use-toast"
import * as XLSX from 'xlsx'

export function UploadDeliveryForm() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [uploadType, setUploadType] = useState("manual")
  const [file, setFile] = useState<File | null>(null)
  const [parsedOrders, setParsedOrders] = useState<any[]>([])
  const [showPreview, setShowPreview] = useState(false)
  const [formData, setFormData] = useState({
    customer_id: "",
    client_name: "",
    client_phone: "",
    address: "",
    packages_count: "",
    driver: "",
    car_number: "",
  })

  interface ParsedOrder {
    customer_id: string
    client_name: string
    client_phone: string
    address: string
    packages_count: number
    driver: string
    car_number: string
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    

    if (!formData.client_name.trim()) {
      toast({
        title: "שגיאה",
        description: "שם לקוח הוא שדה חובה",
        variant: "destructive",
      })
      return
    }

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
          customer_id: formData.customer_id.trim() || undefined,
          client_name: formData.client_name.trim(),
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
          customer_id: "",
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


  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      await parseFile(selectedFile)
    }
  }

  const parseFile = async (file: File) => {
    try {
      if (file.type.includes('sheet') || file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
        await parseExcelFile(file)
      } else if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
        await parseCsvFile(file)
      }
    } catch (error) {
      console.error('Error parsing file:', error)
      toast({
        title: "שגיאה",
        description: "שגיאה בעיבוד הקובץ",
        variant: "destructive",
      })
    }
  }

  const parseExcelFile = async (file: File) => {
    const data = await file.arrayBuffer()
    const workbook = XLSX.read(data)
    const sheetName = workbook.SheetNames[0]
    const worksheet = workbook.Sheets[sheetName]
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
    
    // Skip header row and process data
    const orders = (jsonData as any[]).slice(1).map((row: any[]) => ({
      customer_id: row[0] || '',
      client_name: row[1] || '',
      client_phone: row[2] || '',
      address: row[3] || '',
      packages_count: parseInt(row[4]) || 1,
      driver: row[5] || '',
      car_number: row[6] || '',
    })).filter(order => order.address.trim() && order.client_name.trim()) // Only include orders with required fields
    
    setParsedOrders(orders)
    setShowPreview(true)
  }

  const parseCsvFile = async (file: File) => {
    const text = await file.text()
    const lines = text.split('\n')
    const orders = lines.slice(1).map(line => {
      const values = line.split(',').map(val => val.trim())
      return {
        customer_id: values[0] || '',
        client_name: values[1] || '',
        client_phone: values[2] || '',
        address: values[3] || '',
        packages_count: parseInt(values[4]) || 1,
        driver: values[5] || '',
        car_number: values[6] || '',
      }
    }).filter(order => order.address.trim() && order.client_name.trim()) // Only include orders with required fields
    
    setParsedOrders(orders)
    setShowPreview(true)
  }

  const handleConfirmOrders = async () => {
    if (parsedOrders.length === 0) {
      toast({
        title: "שגיאה",
        description: "אין משלוחים לאישור",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const results = await Promise.all(
        parsedOrders.map(async (order) => {
          const response = await fetch("/api/orders", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              customer_id: order.customer_id.trim() || undefined,
              client_name: order.client_name.trim(),
              client_phone: order.client_phone || null,
              address: order.address.trim(),
              packages_count: order.packages_count,
              driver: order.driver || null,
              car_number: order.car_number || null,
            }),
          })
          return response.ok
        })
      )

      const successCount = results.filter(Boolean).length
      const failureCount = results.length - successCount

      if (successCount > 0) {
        toast({
          title: "הצלחה!",
          description: `${successCount} משלוחים נוצרו בהצלחה${failureCount > 0 ? `, ${failureCount} נכשלו` : ''}`,
          variant: "default",
        })

        // Reset state
        setFile(null)
        setParsedOrders([])
        setShowPreview(false)

        setTimeout(() => {
          router.push("/deliveries")
        }, 1500)
      } else {
        throw new Error("כל המשלוחים נכשלו")
      }
    } catch (error) {
      console.error("Error creating orders:", error)
      toast({
        title: "שגיאה",
        description: "שגיאה ביצירת המשלוחים",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const removeOrder = (index: number) => {
    setParsedOrders(orders => orders.filter((_, i) => i !== index))
  }

  const resetFileUpload = () => {
    setFile(null)
    setParsedOrders([])
    setShowPreview(false)
  }

  return (
    <Card className={`mx-auto shadow-sm ${showPreview ? 'max-w-6xl' : 'max-w-2xl'} transition-all duration-300`}>
      <CardHeader>
        <CardTitle className="text-right">העלאת משלוח חדש</CardTitle>
        <CardDescription className="text-right">בחר את סוג ההעלאה המועדף עליך</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="excel" className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4" />
              Excel
            </TabsTrigger>
            <TabsTrigger value="csv" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              CSV
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              ידני
            </TabsTrigger>
          </TabsList>

          <TabsContent value="excel" className="space-y-6 mt-6">
            <div className="space-y-6">
              {!showPreview ? (
                <>
                  <div className="relative">
                    <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-8 bg-muted/20">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10">
                          <FileSpreadsheet className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                          <Label htmlFor="excel-file" className="text-base font-medium cursor-pointer hover:text-primary transition-colors">
                            העלה קובץ Excel
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            גרור קובץ לכאן או לחץ לבחירה
                          </p>
                        </div>
                        <Input
                          id="excel-file"
                          type="file"
                          accept=".xlsx,.xls"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3 text-right">פורמט נדרש:</h4>
                    <div className="space-y-2 text-right text-sm text-muted-foreground">
                      <div className="grid grid-cols-2 gap-2">
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה A: מזהה לקוח</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה B: שם לקוח *</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה C: טלפון לקוח</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה D: כתובת *</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה E: מספר חבילות *</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה F: נהג</div>
                        <div className="p-2 bg-muted/50 rounded text-center">עמודה G: מספר רכב</div>
                      </div>
                      <p className="text-xs text-muted-foreground">* שדות חובה (מזהה לקוח יתווסף אוטומטית אם לא צוין)</p>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">תצוגה מקדימה - {parsedOrders.length} משלוחים</h3>
                    <Button variant="outline" size="sm" onClick={resetFileUpload}>
                      <X className="h-4 w-4 ml-2" />
                      בטל
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">מזהה לקוח</TableHead>
                          <TableHead className="text-right">שם לקוח</TableHead>
                          <TableHead className="text-right">טלפון</TableHead>
                          <TableHead className="text-right">כתובת</TableHead>
                          <TableHead className="text-right">חבילות</TableHead>
                          <TableHead className="text-right">נהג</TableHead>
                          <TableHead className="text-right">רכב</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedOrders.map((order, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-right font-medium">{order.customer_id}</TableCell>
                            <TableCell className="text-right">{order.client_name || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.client_phone || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.address}</TableCell>
                            <TableCell className="text-right">{order.packages_count}</TableCell>
                            <TableCell className="text-right">{order.driver || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.car_number || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeOrder(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmOrders} 
                    className="w-full h-11" 
                    disabled={loading || parsedOrders.length === 0}
                    size="lg"
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    {loading ? "יוצר משלוחים..." : `אשר ויצור ${parsedOrders.length} משלוחים`}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-6 mt-6">
            <div className="space-y-6">
              {!showPreview ? (
                <>
                  <div className="relative">
                    <div className="border-2 border-dashed border-border hover:border-primary/50 transition-colors rounded-lg p-8 bg-muted/20">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="p-4 rounded-full bg-primary/10">
                          <FileText className="h-8 w-8 text-primary" />
                        </div>
                        <div className="text-center space-y-2">
                          <Label htmlFor="csv-file" className="text-base font-medium cursor-pointer hover:text-primary transition-colors">
                            העלה קובץ CSV
                          </Label>
                          <p className="text-sm text-muted-foreground">
                            גרור קובץ לכאן או לחץ לבחירה
                          </p>
                        </div>
                        <Input
                          id="csv-file"
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                      </div>
                    </div>
                    {file && (
                      <div className="mt-4 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              {file.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(file.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="bg-card border rounded-lg p-4">
                    <h4 className="text-sm font-medium mb-3 text-right">פורמט נדרש (מופרד בפסיקים):</h4>
                    <div className="p-3 bg-muted/30 rounded-lg border">
                      <code className="text-sm font-mono text-foreground block text-center">
                        מזהה לקוח,שם לקוח,טלפון,כתובת,מספר חבילות,נהג,מספר רכב
                      </code>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2 text-right">
                      השורה הראשונה צריכה להכיל את כותרות העמודות. שם לקוח, כתובת ומספר חבילות הם שדות חובה (מזהה לקוח יתווסף אוטומטית)
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">תצוגה מקדימה - {parsedOrders.length} משלוחים</h3>
                    <Button variant="outline" size="sm" onClick={resetFileUpload}>
                      <X className="h-4 w-4 ml-2" />
                      בטל
                    </Button>
                  </div>
                  
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">מזהה לקוח</TableHead>
                          <TableHead className="text-right">שם לקוח</TableHead>
                          <TableHead className="text-right">טלפון</TableHead>
                          <TableHead className="text-right">כתובת</TableHead>
                          <TableHead className="text-right">חבילות</TableHead>
                          <TableHead className="text-right">נהג</TableHead>
                          <TableHead className="text-right">רכב</TableHead>
                          <TableHead className="text-right">פעולות</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {parsedOrders.map((order, index) => (
                          <TableRow key={index}>
                            <TableCell className="text-right font-medium">{order.customer_id}</TableCell>
                            <TableCell className="text-right">{order.client_name || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.client_phone || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.address}</TableCell>
                            <TableCell className="text-right">{order.packages_count}</TableCell>
                            <TableCell className="text-right">{order.driver || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell className="text-right">{order.car_number || <span className="text-muted-foreground">לא צוין</span>}</TableCell>
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => removeOrder(index)}
                                className="h-8 w-8 p-0"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  
                  <Button 
                    onClick={handleConfirmOrders} 
                    className="w-full h-11" 
                    disabled={loading || parsedOrders.length === 0}
                    size="lg"
                  >
                    <CheckCircle className="ml-2 h-4 w-4" />
                    {loading ? "יוצר משלוחים..." : `אשר ויצור ${parsedOrders.length} משלוחים`}
                  </Button>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6 mt-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="customer_id" className="text-right block">
                    מזהה לקוח (אופציונלי)
                  </Label>
                  <Input
                    id="customer_id"
                    value={formData.customer_id}
                    onChange={(e) => setFormData((prev) => ({ ...prev, customer_id: e.target.value }))}
                    placeholder="מזהה יתווסף אוטומטית אם לא צוין"
                    className="text-right"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client_name" className="text-right block">
                    שם לקוח *
                  </Label>
                  <Input
                    id="client_name"
                    required
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
                  <Input
                    id="driver"
                    value={formData.driver}
                    onChange={(e) => setFormData((prev) => ({ ...prev, driver: e.target.value }))}
                    placeholder="הכנס שם הנהג"
                    className="text-right"
                  />
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

              <Button type="submit" className="w-full h-11" disabled={loading} size="lg">
                <Upload className="ml-2 h-4 w-4" />
                {loading ? "מעלה..." : "העלה משלוח"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}
