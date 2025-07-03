"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronLeft, ChevronRight, X, Calendar, MapPin } from "lucide-react";

interface ImageLightboxProps {
  images: string[];
  startIndex: number;
  onClose: () => void;
  exifData: any;
  onExifRequest: (imageUrl: string) => void;
}

export function ImageLightbox({
  images,
  startIndex,
  onClose,
  exifData,
  onExifRequest,
}: ImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [images]);

  useEffect(() => {
    if (images[currentIndex]) {
      onExifRequest(images[currentIndex]);
    }
  }, [currentIndex, images, onExifRequest]);

  const goToPrevious = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === 0 ? images.length - 1 : prevIndex - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prevIndex) =>
      prevIndex === images.length - 1 ? 0 : prevIndex + 1,
    );
  };

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const currentExif = exifData[currentImage];

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="p-0 m-0 bg-black border-0 max-w-none w-screen h-screen flex items-center justify-center">
        <DialogTitle className="sr-only">Image Lightbox</DialogTitle>
        <div className="relative w-full h-full flex items-center justify-center">
          <img
            src={currentImage}
            alt={`Image ${currentIndex + 1}`}
            className="max-h-full max-w-full object-contain"
          />

          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:text-white hover:bg-white/20 z-50"
            onClick={onClose}
          >
            <X className="h-8 w-8" />
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-white hover:bg-white/20 z-50"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-10 w-10" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-white hover:bg-white/20 z-50"
                onClick={goToNext}
              >
                <ChevronRight className="h-10 w-10" />
              </Button>
            </>
          )}

          {/* EXIF Data Display */}
          <div className="absolute bottom-4 left-4 bg-black bg-opacity-60 text-white text-sm p-3 rounded-lg space-y-2 z-50">
            {currentExif?.loading && (
              <div className="space-y-2">
                <Skeleton className="h-5 w-32 bg-gray-500" />
                <Skeleton className="h-5 w-24 bg-gray-500" />
              </div>
            )}
            {currentExif && !currentExif.loading && !currentExif.error && (
              <>
                {currentExif.dateTimeOriginal && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {new Date(
                        currentExif.dateTimeOriginal.replace(
                          /(\d{4}):(\d{2}):(\d{2})/,
                          "$1-$2-$3",
                        ),
                      ).toLocaleString("he-IL", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </span>
                  </div>
                )}
                {currentExif.gps?.latitude && currentExif.gps?.longitude && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${currentExif.gps.latitude},${currentExif.gps.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      View on Map
                    </a>
                  </div>
                )}
              </>
            )}
             {currentExif?.error && (
                <span className="text-red-400">Could not load EXIF data.</span>
             )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}