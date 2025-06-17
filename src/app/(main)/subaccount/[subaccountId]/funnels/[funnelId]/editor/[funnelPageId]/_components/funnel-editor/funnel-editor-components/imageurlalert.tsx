import React, { useState } from 'react'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
  AlertDialogTrigger 
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"

type ImageUrlAlertProps = {
  onConfirm: (url: string) => void
}

export const ImageUrlAlert = ({ onConfirm }: ImageUrlAlertProps) => {
  const [imageUrl, setImageUrl] = useState('')

  const handleConfirm = () => {
    if (imageUrl.trim()) {
      onConfirm(imageUrl.trim())
    }
  }

  return (
    <AlertDialog>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Add Image</AlertDialogTitle>
          <AlertDialogDescription>
            Paste the URL of the image you want to add
          </AlertDialogDescription>
          <Input 
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://example.com/image.jpg"
          />
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>
            Add Image
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}