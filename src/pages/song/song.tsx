import { useParams } from "react-router-dom";

import { MatchParams } from "@/types/params";

const Song = () => {
  const { id } = useParams<MatchParams>();

  return <div>{id}</div>;
};

export default Song;
