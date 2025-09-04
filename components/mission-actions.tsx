"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Edit, Trash2 } from "lucide-react"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { DropdownMenuItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { MissionEditModal } from "@/components/mission-edit-modal"
import { LoadingSpinner } from "@/components/loading-states"
import type { Mission } from "@/lib/types"
import { useRouter } from "next/navigation"

interface MissionActionsProps {
  mission: Mission
  onUpdate?: () => void
  onDelete?: () => void
  showLabels?: boolean
  variant?: "default" | "outline" | "ghost"
  size?: "default" | "sm" | "lg"
  asDropdownItems?: boolean
}

export function MissionActions({ 
  mission, 
  onUpdate, 
  onDelete, 
  showLabels = false,
  variant = "outline",
  size = "sm",
  asDropdownItems = false
}: MissionActionsProps) {
  const router = useRouter()
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleEditClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()
    setDeleteDialogOpen(true)
  }

  const handleDeleteConfirm = async () => {
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${mission.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setDeleteDialogOpen(false)
        if (onDelete) {
          onDelete()
        } else {
          // If no onDelete callback, navigate to deliveries page
          router.push('/deliveries')
        }
      } else {
        console.error('Failed to delete mission')
      }
    } catch (error) {
      console.error('Error deleting mission:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleEditSuccess = () => {
    console.log('Edit success callback triggered, calling onUpdate...');
    setEditDialogOpen(false)
    if (onUpdate) {
      onUpdate()
    } else {
      console.log('No onUpdate callback provided to MissionActions');
    }
  }

  const ActionButtons = () => (
    <div className="flex gap-2">
      <Button 
        variant={variant} 
        size={size}
        onClick={handleEditClick}
      >
        <Edit className={showLabels ? "ml-2 h-4 w-4" : "h-4 w-4"} />
        {showLabels && "עריכה"}
      </Button>
      <Button
        variant={variant}
        size={size}
        onClick={handleDeleteClick}
        className="text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
      >
        <Trash2 className={showLabels ? "ml-2 h-4 w-4" : "h-4 w-4"} />
        {showLabels && "מחיקה"}
      </Button>
    </div>
  )

  const DropdownItems = () => (
    <>
      <DropdownMenuItem 
        onClick={(e) => handleEditClick(e)}
        role="menuitem"
        aria-label={`ערוך משימה ${mission.id}`}
      >
        <Edit className="mr-2 h-4 w-4" aria-hidden="true" /> עריכה
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
        onClick={(e) => handleDeleteClick(e)}
        role="menuitem"
        aria-label={`מחק משימה ${mission.id}`}
      >
        <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" /> מחק משימה
      </DropdownMenuItem>
    </>
  )

  return (
    <>
      {asDropdownItems ? <DropdownItems /> : <ActionButtons />}

      {/* Edit Modal */}
      <MissionEditModal 
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        mission={mission}
        onSuccess={handleEditSuccess}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-right">מחיקת משימה</AlertDialogTitle>
            <AlertDialogDescription className="text-right">
              האם אתה בטוח שברצונך למחוק את משימה #{mission.id}?
              פעולה זו לא ניתנת לביטול.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel disabled={isDeleting}>ביטול</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? (
                <div className="flex items-center">
                  <LoadingSpinner size="sm" />
                  <span className="mr-2">מוחק...</span>
                </div>
              ) : (
                "מחק"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}