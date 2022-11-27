import React from 'react'
import { FaPlay } from "react-icons/fa";
import {Card} from './CardContainer.style'

function CardContainer() {
  return (
    <Card>
      <container>
        <img
          src={
            "https://sdlhivkcdnems05.cdnsrv.jio.com/c.saavncdn.com/793/Midnights-English-2022-20221021103611-500x500.jpg"
          }
          alt={"Taylor Swift"}
        />
        <button onClick={() => console.log("Taylor")}>
          <FaPlay size={50} color="#74f2ce" />
        </button>
      </container>
      <h4>Anti-Hero</h4>
      <h5>Taylor Swift</h5>
    </Card>
  );
}

export default CardContainer