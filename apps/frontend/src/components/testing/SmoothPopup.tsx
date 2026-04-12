import React, { useState } from 'react';

const AnimatedPopupCard: React.FC = () => {
  const [isOpen, setIsOpen] = useState<boolean>(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-8">
      {/* The drop-shadow wrapper.
        Because our new corner divs have true transparency, the shadow will 
        perfectly trace the curves.
      */}
      <div className="relative drop-shadow-xl">
        
        {/* Base Card */}
        <div className="relative w-80 h-48 bg-white rounded-3xl flex items-center justify-center">
          
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="px-6 py-2 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors z-20"
          >
            {isOpen ? 'Close Popup' : 'Open Popup'}
          </button>

          {/* Popup Container */}
          <div 
            className={`absolute bottom-full left-8 w-48 bg-white rounded-t-2xl pt-5 pb-3 px-5 z-10 transition-all duration-300 ease-out origin-bottom
              ${isOpen ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-90 pointer-events-none'}
            `}
          >
            
            <h3 className="text-gray-800 font-bold text-lg">New Alert</h3>
            <p className="text-gray-500 text-sm mt-1">
              Emerging perfectly smoothly with true transparent carving.
            </p>

            {/* LEFT INVERSE CORNER 
              How it works: A 16x16 box. The radial gradient starts at the top-left (0,0)
              and draws a transparent circle outward for 16px. Everything past that is solid white. 
              This perfectly "carves out" the top-left, leaving a swooping white base in the bottom-right.
            */}
            <div className="absolute bottom-0 -left-4 w-4 h-4 bg-[radial-gradient(circle_at_top_left,transparent_16px,#ffffff_16px)]"></div>

            {/* RIGHT INVERSE CORNER 
              Same logic, but the transparent circle starts at the top-right to carve out the opposite side.
            */}
            <div className="absolute bottom-0 -right-4 w-4 h-4 bg-[radial-gradient(circle_at_top_right,transparent_16px,#ffffff_16px)]"></div>

          </div>
        </div>
        
      </div>
    </div>
  );
};

export default AnimatedPopupCard;