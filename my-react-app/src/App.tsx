import './App.css';
import React, { useState, useEffect } from "react";
import axios from "axios";

function App() {
  const [data, setData] = useState([]);

  const fetchInfo = () => {
    return fetch("http://localhost:3000/opportunities")
      .then((res) => res.json())
      .then((d) => setData(d.classifications))
  }

  useEffect(() => {
    fetchInfo();
  }, []);
  
  return (
    <>
    <table className="opportunities">
      <thead>
        <tr><th>Opportunity</th></tr>
      </thead>
      <tbody>
      {data.filter((each) => (each["prediction"] == 'Opportunity')).map((each) => <tr><td>{each["input"]}</td></tr>)}
      </tbody>
    </table>

    <table className="opportunities">
      <thead>
        <tr><th>Competition</th></tr>
      </thead>
      <tbody>
      {data.filter((each) => (each["prediction"] == 'Competition')).map((each) => <tr><td>{each["input"]}</td></tr>)}
      </tbody>
    </table>
    </>

  )
}

export default App
