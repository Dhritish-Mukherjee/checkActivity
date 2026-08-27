import React from 'react';
import Lottie from 'lottie-react';
import animationData from '../../public/Pet Loading.json';

const CatLoader = ({ text = "Loading...", size = "w-32 h-32" }) => {
  return (
    <div className="flex flex-col items-center justify-center py-10 gap-4 w-full h-full min-h-[200px]">
      <div className={`${size} opacity-90 drop-shadow-2xl`}>
        <Lottie animationData={animationData} loop={true} />
      </div>
      <p className="text-xs font-bold tracking-widest uppercase text-indigo-400 animate-pulse">{text}</p>
    </div>
  );
};

export default CatLoader;
