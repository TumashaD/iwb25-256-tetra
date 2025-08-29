"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Carousel,
  CarouselApi,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { Competition } from "@/services/competitionService";
import { CompetitionCard } from "@/components/competition-card";

export interface GalleryProps {
  competitions: Competition[];
}

const Gallery = ({ competitions }: GalleryProps) => {
  const [carouselApi, setCarouselApi] = useState<CarouselApi>();
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    if (!carouselApi) {
      return;
    }
    const updateSelection = () => {
      setCanScrollPrev(carouselApi.canScrollPrev());
      setCanScrollNext(carouselApi.canScrollNext());
      setCurrentSlide(carouselApi.selectedScrollSnap());
    };
    updateSelection();
    carouselApi.on("select", updateSelection);
    return () => {
      carouselApi.off("select", updateSelection);
    };
  }, [carouselApi]);

  return (
    <section className="py-10 w-full overflow-hidden">
      <div className="container mx-auto px-4 w-full overflow-hidden">
        <div className="mb-8 flex justify-center md:mb-10 lg:mb-10">
          <div className="hidden shrink-0 gap-2 md:flex">
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollPrev();
              }}
              disabled={!canScrollPrev}
              className="disabled:pointer-events-auto"
            >
              <ArrowLeft className="size-5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => {
                carouselApi?.scrollNext();
              }}
              disabled={!canScrollNext}
              className="disabled:pointer-events-auto"
            >
              <ArrowRight className="size-5" />
            </Button>
          </div>
        </div>

        <div className="relative w-full">
          <Carousel
            setApi={setCarouselApi}
            className="w-full"
            opts={{
              align: "start",
              containScroll: "trimSnaps",
              breakpoints: {
                "(max-width: 768px)": {
                  dragFree: true,
                },
              },
            }}
          >
            <CarouselContent className="ml-0 h-[510px] -mr-4">
              {competitions.map((competition) => (
                <CarouselItem
                  key={competition.id}
                  className="pl-4 pr-0 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 snap-start"
                >
                  <div className="w-full h-full">
                    <CompetitionCard
                      competition={competition}
                      key={competition.id}
                      userType={"competitor"}
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {competitions.map((_, index) => (
            <button
              key={index}
              className={`h-2 w-2 rounded-full transition-colors ${currentSlide === index ? "bg-primary" : "bg-primary/20"
                }`}
              onClick={() => carouselApi?.scrollTo(index)}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export { Gallery };