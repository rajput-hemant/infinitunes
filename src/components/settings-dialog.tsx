import {
  setDownloadQuality,
  setImageQuality,
  setSongStreamingQuality,
} from "@/store/root-slice";
import { SongQuality } from "@/lib/utils";
import { useAppDispatch, useLocalStorage } from "@/hooks";
import Label from "./ui/label";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";
import {
  TopographyH3,
  TopographyLarge,
  TopographySubtle,
} from "./ui/topography";

enum ImageQuality {
  small = "small",
  medium = "medium",
  large = "large",
}

const Settings = () => {
  const dispatch = useAppDispatch();

  const [, setSongQuality_] = useLocalStorage("songQuality", SongQuality.best);
  const [, setDownloadQuality_] = useLocalStorage(
    "downloadQuality",
    SongQuality.best
  );
  const [, setImageQuality_] = useLocalStorage(
    "imageQuality",
    ImageQuality.medium
  );

  const songStreamingQuality: { [key: string]: string } = {
    poor: "12kbps",
    low: "48kbps",
    medium: "96kbps",

    high: "160kbps",
    best: "256kbps",
    lossless: "320kbps",
  };

  const streamQualityHandler = (value: SongQuality) => {
    setSongQuality_(value);
    dispatch(setSongStreamingQuality(value));
  };

  const downloadQualityHandler = (value: SongQuality) => {
    setDownloadQuality_(value);
    dispatch(setDownloadQuality(value));
  };

  const imageQualityHandler = (value: ImageQuality) => {
    setImageQuality_(value);
    dispatch(setImageQuality(value));
  };

  return (
    <div className="w-full">
      <TopographyH3 className="w-full text-center">Settings</TopographyH3>

      <div className="space-y-3 md:p-4">
        <RadioGroup
          defaultValue={SongQuality.best}
          onValueChange={streamQualityHandler}
        >
          <TopographyLarge className="border-border  border-b-2">
            Song Streaming Quality
          </TopographyLarge>

          <div className="grid grid-cols-2 gap-2 md:p-2">
            {Object.entries(SongQuality).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={key} />
                <Label htmlFor={key} className="truncate capitalize">
                  {key} {songStreamingQuality[key]}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <RadioGroup
          defaultValue={SongQuality.best}
          onValueChange={downloadQualityHandler}
        >
          <TopographyLarge className="border-border  border-b-2">
            Download Quality
          </TopographyLarge>

          <div className="grid grid-cols-2 gap-2 md:p-2">
            {Object.entries(SongQuality).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <RadioGroupItem value={value} id={key} />
                <Label htmlFor={key} className="truncate capitalize">
                  {key} {songStreamingQuality[key]}
                </Label>
              </div>
            ))}
          </div>
        </RadioGroup>

        <RadioGroup
          defaultValue={ImageQuality.medium}
          onValueChange={imageQualityHandler}
        >
          <TopographyLarge className="border-border  border-b-2">
            Image Quality
          </TopographyLarge>

          {Object.entries(ImageQuality).map(([key, value]) => (
            <div key={key} className="flex items-center space-x-2">
              <RadioGroupItem value={value} id={key} />
              <Label htmlFor={key} className="truncate capitalize">
                {key}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <TopographySubtle className="w-full pt-4 text-center brightness-50">
          Your settings will be saved locally in your browser.
        </TopographySubtle>
      </div>
    </div>
  );
};

export default Settings;
