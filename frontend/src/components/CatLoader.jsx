import React, { useState, useEffect } from 'react';
import { Lottie } from 'lottie-react';

let cachedAnimationData = null;
let fetchPromise = null;

const CatLoader = ({ text = "Loading...", size = "w-32 h-32 md:w-48 md:h-48 lg:w-56 lg:h-56" }) => {
  const [animationData, setAnimationData] = useState(cachedAnimationData);

  useEffect(() => {
    if (cachedAnimationData) {
      setAnimationData(cachedAnimationData);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = fetch('/pet-loading.json')
        .then(res => res.json())
        .then(data => {
          cachedAnimationData = data;
          return data;
        })
        .catch(err => {
          console.error("Failed to load Lottie animation:", err);
          return null;
        });
    }

    fetchPromise.then(data => {
      if (data) setAnimationData(data);
    });
  }, []);

  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 w-full h-full min-h-[200px]">
      {animationData ? (
        <div className={`${size} opacity-90 drop-shadow-2xl`}>
          <Lottie animationData={animationData} loop={true} autoplay={true} />
        </div>
      ) : (
        <div className={`${size} flex items-center justify-center`}>
          {/* Waiting for Lottie JSON to load */}
        </div>
      )}
      <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 animate-pulse">{text}</p>
    </div>
  );
};

export default CatLoader;
