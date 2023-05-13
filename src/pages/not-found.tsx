const NotFound = () => {
  return (
    <div className="flex flex-col items-center">
      <img className="w-72" src="/images/404.png" />

      <h3 className="py-4 text-5xl">This page seems to be missing.</h3>
      <h4>But, there are plenty of other great tunes! </h4>
      <h4> Try one of these:</h4>
    </div>
  );
};

export default NotFound;
