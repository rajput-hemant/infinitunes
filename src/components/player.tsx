import { MoreVertical, Repeat, Shuffle, Volume2 } from "lucide-react";

import { Icons } from "./icons";
import { Skeleton } from "./ui/skeleton";
import { Slider, SliderRange, SliderThumb, SliderTrack } from "./ui/slider";
import { Muted } from "./ui/topography";

const Player = () => {
  return (
    <div className="fixed inset-x-0 bottom-14 h-20 bg-background animate-in slide-in-from-bottom-full [animation-duration:500ms] lg:bottom-0">
      <Slider>
        <SliderTrack className="h-1 cursor-pointer">
          <SliderRange />
        </SliderTrack>

        <SliderThumb className="h-4 w-4 cursor-pointer" />
      </Slider>

      <div className="flex items-center px-4 pt-3 lg:px-4">
        <div className="flex w-1/2 gap-4 lg:w-1/3">
          {/* <div className="relative aspect-square h-12 overflow-hidden rounded-md">
          <Image src="/images/logo192.png" width={50} height={50} alt="" />
          
          <Skeleton className="absolute inset-0 -z-10" />
        </div>

        <div className="flex flex-col justify-center">
          <p className="line-clamp-1 text-sm font-semibold text-primary">
            Song name
          </p>

          <Muted className="line-clamp-1">Artist name</Muted>
        </div> */}
          <div className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-md" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-44 lg:w-64" />
              <Skeleton className="h-3 w-52 2xl:w-[500px]" />
            </div>
          </div>
        </div>

        <div className="flex w-1/2 justify-end lg:w-1/3 lg:justify-evenly">
          <button>
            <Repeat strokeWidth={2} className="hidden h-7 w-7 lg:block" />
            {/* <Repeat1 strokeWidth={2} className="hidden h-7 w-7 lg:block"/> */}
          </button>

          <button>
            <Icons.SkipBack className="hidden h-10 w-10 lg:block" />
          </button>

          <button>
            <Icons.Play className="h-10 w-10" />
            {/* <Loader2 className="animate-spin" /> */}
            {/* <Pause className=""/> */}
          </button>

          <button>
            <Icons.SkipForward className="hidden h-10 w-10 lg:block" />
          </button>

          <button>
            <Shuffle strokeWidth={2.35} className="hidden lg:block" />
          </button>
        </div>

        <div className="hidden w-1/3 items-center justify-end gap-4 lg:flex">
          <Muted>0:00/0:00</Muted>

          <button>
            {/* <VolumeX /> */}
            {/* <Volume /> */}
            {/* <Volume1 /> */}
            <Volume2 strokeWidth={2} />
          </button>

          <button>
            <MoreVertical />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Player;
