export default function Loading() {
  return (
    <div className="grid h-[calc(100vh-14rem)] w-full place-items-center lg:ml-[-8%]">
      <div className="border-primary aspect-square h-16 animate-spin rounded-full border-y-2 lg:h-32"></div>
    </div>
  );
}
