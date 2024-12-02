// pages/index.js
"use client"

import { useEffect, useState } from 'react';



export default function Home() {
  interface DataItem {
    _id: string;
    name: string;
  }
  

  const [data, setData] = useState<DataItem[]>([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch('/api/assignments');
      const assignments = await response.json();
      setData(assignments);
    }
      fetchData();
  }, []);


  return (
    <div>
      <h1>Data from MongoDB</h1>
      <ul>
        {data.map((item) => (
          <li key={item._id}>{item.name}</li>
        ))}
      </ul>
    </div>
  );
}


