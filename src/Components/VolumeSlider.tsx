import React, { useState } from "react";
import * as Slider from "@radix-ui/react-slider";

function VolumeSlider() {
  const [value, setValue] = useState([50]);

  return (
    <Slider.Root
      className="relative flex w-64 touch-none select-none items-center"
      value={value}
      onValueChange={setValue}
      min={0}
      max={100}
      step={1}
      aria-label="Volume"
    >
      <Slider.Track className="relative h-2 w-full grow overflow-hidden rounded-full bg-zinc-700">
        <Slider.Range className="absolute h-full bg-green-500" />
      </Slider.Track>
      <Slider.Thumb className="block h-5 w-5 rounded-full bg-white shadow focus:outline-none focus:ring-2 focus:ring-green-400" />
    </Slider.Root>
  );
}

export default VolumeSlider;
