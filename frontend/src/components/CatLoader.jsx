import React, { useState, useEffect } from 'react';
import { Lottie } from 'lottie-react';

const CatLoader = ({ text = "Loading...", size = "w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56" }) => {
  const [animationData, setAnimationData] = useState(null);

  useEffect(() => {
    fetch('/pet-loading.json')
      .then(res => res.json())
      .then(data => setAnimationData(data))
      .catch(err => console.error("Failed to load Lottie animation:", err));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 w-full h-full min-h-[200px]">
      {animationData ? (
        <div className={`${size} opacity-90 drop-shadow-2xl`}>
          <Lottie animationData={animationData} loop={true} autoplay={true} />
        </div>
      ) : (
        <div className={`${size} flex items-center justify-center`}>
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      )}
      <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 animate-pulse">{text}</p>
    </div>
  );
};

export default CatLoader;
