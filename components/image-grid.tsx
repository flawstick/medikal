
'use client';

import Image from "next/image";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const R2_BASE_URL = "https://pub-935a9967c0664658862019699749d4f6.r2.dev";

export function ImageGrid({
  title,
  imageKeys,
}: {
  title: string;
  imageKeys: string[] | undefined;
}) {
  const [open, setOpen] = useState(false);
  const [startIndex, setStartIndex] = useState(0);

  if (!imageKeys || imageKeys.length === 0) return null;

  const openCarousel = (index: number) => {
    setStartIndex(index);
    setOpen(true);
  };

  return (
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">{title}</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {imageKeys.map((key, index) => (
          <div key={key} className="cursor-pointer" onClick={() => openCarousel(index)}>
            <Image
              src={`${R2_BASE_URL}/${key}`}
              alt={title}
              width={200}
              height={200}
              className="rounded-lg object-cover aspect-square"
            />
          </div>
        ))}
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          <Carousel className="flex-grow" opts={{ startIndex, direction: "ltr" }}>
            <CarouselContent className="h-full">
              {imageKeys.map((key) => (
                <CarouselItem key={key} className="flex items-center justify-center">
                  <img
                    src={`${R2_BASE_URL}/${key}`}
                    alt={title}
                    className="max-h-full max-w-full object-contain rounded-lg"
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </DialogContent>
      </Dialog>
    </div>
  );
}
