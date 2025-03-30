"use client";

import { Stack, Text } from "@chakra-ui/react";
import { Button } from "@/components/ui/button"
import { useEffect } from "react";
import { useSession } from "next-auth/react";



export default function Home() {
  useEffect(() => {
    const daysUntilNextChristmas = (): number => {
      const today = new Date();
      const currentYear = today.getFullYear();
      const nextChristmas = new Date(currentYear, 11, 25); // December 25th
    
      // If today is after December 25th, set next Christmas to December 25th of the next year
      if (today > nextChristmas) {
        nextChristmas.setFullYear(currentYear + 1);
      }
    
      // Calculate the difference in milliseconds and convert to days
      const msInDay = 24 * 60 * 60 * 1000;
      return Math.ceil((nextChristmas.getTime() - today.getTime()) / msInDay);
    };

    const daysToChristmas = daysUntilNextChristmas();


    const daysElement = document.getElementById("days");
    if (daysElement) {
      if (daysToChristmas === 0) {
        daysElement.textContent = "Have a Great Christmas Party!";
      } else if (daysToChristmas < 0) {
        daysElement.textContent = `The Christmas Party was ${-1 * daysToChristmas} days ago.`;
      } else {
        daysElement.textContent = `${daysToChristmas} Days to the Christmas Party!`;
      }
    }

    const snowDrop = (num: number) => {
      for (let i = 0; i < num; i++) {
        const drop = document.createElement("div");
        drop.className = "drop snow";
        drop.id = `drop_${i}`;
        drop.style.left = `${randomInt(0, window.innerWidth)}px`;
        drop.style.top = `-${randomInt(0, 50)}px`;
        drop.style.animationDelay = `${randomInt(0, 5)}s`;
        drop.style.animationDuration = `${randomInt(5, 10)}s`;

        document.body.appendChild(drop);
        drop.classList.add("animate");
      }
    };

    const randomInt = (min: number, max: number) => {
      return Math.floor(Math.random() * (max - min + 1) + min);
    };

    snowDrop(35);
  }, []);

  return (
    <div className="container">
      <Stack
        align="center"
        justify="center"
        gap={4}
        px={{ base: 4, md: 8 }}
        w="100vw" /* Ensures full viewport width */
        minH="100vh" /* Ensures full viewport height */
        minW="375px"
        maxW="100%" /* Prevents overflow */
      >
        <Stack align="center" justify="center" >
          <Text fontWeight="bold" color="white" fontSize={{ base: "4xl", md: "7xl" }}>
            ASC Secret Santa
          </Text>
            {/* <Text color="white" fontSize={{ base: "2xl", md: "4xl" }}>
            {session?.user_id}
            </Text> */}
          <Text fontWeight="normal" color="white" fontSize={{ base: "3xl", md: "6xl" }}>
            {new Date().getFullYear()}
          </Text>
          {/* <Text fontWeight="bold" color="white" fontSize="2xl">
            ________________________________________
          </Text> */}
          <hr style={{ borderTop: '2px solid white', width: '80%' }} />
          <Text fontWeight="bold" fontSize={{ base: "sm", md: "3xl" }} color="white" id="days"></Text>
          <hr style={{ borderTop: '2px solid white', width: '80%' }} />
            <button
              className="bg-white hover:bg-gray-100 text-red-500 font-bold py-2 rounded w-1/4 text-xs md:text-lg mt-4"              
              onClick={() => (window.location.href = "/from")}
            >
              Get Started
            </button>
        </Stack>
      </Stack>
      <style>{`
        body {
          background-color: #f24236;
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100vh;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          position: relative;
        }

        .container {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
          overflow: hidden;
        }

        .drop {
          position: absolute;
          top: 0;
          z-index: 1;
          opacity: 1;
        }

        .snow {
          height: 8px;
          width: 8px;
          border-radius: 50%;
          background-color: #fff;
          box-shadow: 0 0 10px #fff;
        }

        .animate {
          animation: falling 6s infinite ease-in;
        }

        @keyframes falling {
          0% {
            top: 0;
            opacity: 1;
          }
          100% {
            top: 150vh;
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}