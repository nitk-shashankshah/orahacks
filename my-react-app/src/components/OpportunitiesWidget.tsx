import React from "react";

interface Opportunity {
  title: string;
  location: string;
  date: string;
  image: string;
}

const opportunity: Opportunity = {
  title: "Software Engineer",
  location: "San Francisco, CA",
  date: "Feb 15, 2025",
  image: "https://images.pexels.com/photos/30667170/pexels-photo-30667170/free-photo-of-close-up-of-the-waxing-gibbous-moon-against-night-sky.jpeg", // Replace with actual image URL
};

const Opportunities: React.FC = () => {
  return (
    <div className="p-4 rounded-lg shadow-md">
      {/* Heading with Yellow Vertical Bar */}
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold text-white relative pl-4">
          Opportunities
          <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-yellow-400"></span>
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-4">
        {Array(3).fill(opportunity).map((item, index) => (
          <div key={index} className="flex items-center p-4 border-b border-gray-600">
            <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg border-2 border-white mr-4" />
            <div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-gray-400">({item.location})</p>
              <p className="text-gray-500">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Opportunities;
