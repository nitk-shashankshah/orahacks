import React from "react";
import Navbar from "../components/Navbar";
import OpportunitiesWidget from "../components/OpportunitiesWidget";
import SalesWidget from "../components/SalesWidget";
import IndustryTrendsWidget from "../components/IndustryTrendsWidget";

// import BrandingWidget from "../components/BrandingWidget";
// import SportswearMarketShare from "../components/SportswearMarketShare";

function Home() {
    const widgets = [
      { component: <OpportunitiesWidget />, id: 1 },
      { component: <SalesWidget />, id: 2 },
      { component: <IndustryTrendsWidget />, id: 3 },
      // ... more widgets
    ];
  
    return (
      <div>
        <Navbar />
        <div className="container mx-auto mt-8 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {widgets.map((widget, index) => (
              <div 
                key={widget.id}
                className={index % 2 === 0 ? "md:col-start-1" : "md:col-start-2"}
              >
                {widget.component}
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

export default Home;