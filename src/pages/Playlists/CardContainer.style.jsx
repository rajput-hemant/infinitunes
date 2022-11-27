import styled from "styled-components";

export const Card = styled.div`
display: flex;
flex-direction: column;
justify-content: start;
align-items: center;
  height: auto;
  width: 300px;
  margin: 10px 5px;
  container {
    height: 320px;
    margin-bottom: 10px;
    img {
      border-radius: 10px;
      height: 300px;
      width: 300px;
      margin-bottom: 10px;
      transition: all 150ms ease-in;
    }
    button {
      position: relative;
      top: -50%;
      left: 45%;
      border-radius: 10px;
      background: transparent;
      border: none;
      z-index: 100;
      opacity: 0;
      transition: all 150ms ease-in;
      &:hover {
        scale: 1.2;
        cursor: pointer;
      }
    }
    &:hover img {
      opacity: 0.6;
      border: 3px solid #74f2ce;
      box-shadow: 7px 7px 10px #74f2ce;
    }
    &:hover button {
      opacity: 1;
    }
  }

  h4 {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: white;
    font-size: large;
    text-align: center;
    font-family: Roboto, sans-serif;

    &:hover {
      text-shadow: 2px 2px 10px #74f2ce;
    }
  }

  h5 {
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
    color: grey;
    font-size: smaller;
    text-align: center;
    font-family: Roboto, sans-serif;
  }
  @media (max-width: 1230px) {
    height: 300px;
    width: 280px;
    container {
      img {
        height: 280px;
        width: 280px;
      }
    }
  }
  @media (max-width: 1100px) {
    height: 250px;
    width: 220px;
    container {
      img {
        height: 220px;
        width: 220px;
      }
    }
  }
`;
