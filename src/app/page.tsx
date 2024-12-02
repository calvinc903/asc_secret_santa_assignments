"use client";

import { useEffect } from "react";

export default function Home() {
  useEffect(() => {
    const myDate = new Date();
    const xmas = Date.parse(`Dec 25, ${myDate.getFullYear()}`);
    const today = Date.parse(myDate.toString());
  
    const daysToChristmas = Math.round((xmas - today) / (1000 * 60 * 60 * 24));
  
    const daysElement = document.getElementById("days");
    if (daysElement) {
      if (daysToChristmas === 0) {
        daysElement.textContent = "It's Christmas!! Merry Christmas!";
      } else if (daysToChristmas < 0) {
        daysElement.textContent = `Christmas was ${-1 * daysToChristmas} days ago.`;
      } else {
        daysElement.textContent = `${daysToChristmas} days to Christmas!`;
      }
    }
  
    // Snow effect
    const snowDrop = (num: number) => {
      for (let i = 0; i < num; i++) {
        const drop = document.createElement("div");
        drop.className = "drop snow";
        drop.id = `drop_${i}`;
        drop.style.left = `${randomInt(0, window.innerWidth)}px`; // Spread across full screen width
        drop.style.top = `-${randomInt(0, 50)}px`; // Start slightly above the viewport
        drop.style.animationDelay = `${randomInt(0, 5)}s`; // Random delay for staggered start
        drop.style.animationDuration = `${randomInt(5, 10)}s`; // Random duration for varied speeds
  
        document.body.appendChild(drop);
        drop.classList.add("animate"); // Ensure the animation class is applied
      }
    };
  
    const randomInt = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };
  
    // Generate snowflakes
    snowDrop(35);
  }, []);

  return (
    <div className="container">
      <h1 id="title">ASC Secret Santa 2024</h1>
      {/* <input type="text" id="nameInput" placeholder="What is your Name?" /> */}
      {/* <p id="days"></p> */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css?family=Cookie");

        body {
          background-color: #f24236;
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100vh;
          font-family: "Cookie", cursive;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .container {
          text-align: center;
        }

        #days {
          font-size: 50px;
          color: #fff;
          letter-spacing: 3px;
        }
        #title {
        font-size: 120px;
        color: #fff;
        letter-spacing: 3px;
        }

        .drop {
          position: absolute;
          top: 0;
          z-index: -1;
          opacity: 0;
        }

        .snow {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background-color: #fff;
          box-shadow: 0 0 10px #fff;
        }

        .animate {
          animation: falling 6s infinite ease-in; /* Faster animation for dynamic effect */
        }

        @keyframes falling {
          0% {
            top: 0;
            opacity: 1;
          }
          100% {
            top: 150vh; /* Snow falls further */
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
