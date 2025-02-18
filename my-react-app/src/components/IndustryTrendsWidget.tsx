import React from "react";

interface Trend {
  title: string;
  industry: string;
  date: string;
  image: string;
}

// Static industry trend data
const trend: Trend = {
  title: "AI in Manufacturing",
  industry: "Technology",
  date: "April 5, 2025",
  image: "https://images.pexels.com/photos/373543/pexels-photo-373543.jpeg", // Replace with actual image URL
};

const IndustryTrendsWidget: React.FC = () => {
  return (
    <div className="p-4  rounded-lg shadow-md">
      {/* Heading with Yellow Vertical Bar */}
      <div className="flex items-center mb-4">
        <h2 className="text-xl font-semibold text-white relative pl-4">
          Industry Trends
          <span className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-yellow-400"></span>
        </h2>
      </div>

      {/* Grid Layout */}
      <div className="grid gap-4">
        {Array(2).fill(trend).map((item, index) => (
          <div key={index} className="flex items-center p-4 border-b border-gray-600">
            {/* Image with White Border */}
            <img src={item.image} alt={item.title} className="w-20 h-20 rounded-lg border-2 border-white mr-4" />
            
            {/* Text Information */}
            <div>
              <h3 className="text-lg font-bold text-white">{item.title}</h3>
              <p className="text-gray-400">({item.industry})</p>
              <p className="text-gray-500">{item.date}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IndustryTrendsWidget;
