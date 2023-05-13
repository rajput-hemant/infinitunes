import { TbLoader2 } from "react-icons/tb";

type LoadingProps = {
  iconSize?: number;
};

const Loading = ({ iconSize = 30 }: LoadingProps) => {
  return (
    <div className="flex h-full w-full items-center justify-center">
      <TbLoader2 className="animate-spin" size={iconSize} />
    </div>
  );
};

export default Loading;
