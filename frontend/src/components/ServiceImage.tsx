import React from 'react';
import { Image as ImageIcon } from 'lucide-react';

const pastelBackgrounds = [
  'bg-[#eaf2ff]',
  'bg-[#f3edff]',
  'bg-[#e9f7f1]',
  'bg-[#fff2e8]',
  'bg-[#fff0f3]',
  'bg-[#f0f4e8]',
];

interface ServiceImageProps {
  imageUrl?: string;
  title: string;
  className: string;
  imageClassName?: string;
  children?: React.ReactNode;
}

export const ServiceImage: React.FC<ServiceImageProps> = ({
  imageUrl,
  title,
  className,
  imageClassName = '',
  children,
}) => {
  const colorIndex = Array.from(title).reduce((sum, character) => sum + character.charCodeAt(0), 0)
    % pastelBackgrounds.length;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {imageUrl ? (
        <img src={imageUrl} alt={title} className={`h-full w-full object-cover ${imageClassName}`} />
      ) : (
        <div className={`absolute inset-0 flex items-center justify-center ${pastelBackgrounds[colorIndex]}`}>
          <ImageIcon className="h-8 w-8 text-slate-400/60" aria-hidden="true" />
        </div>
      )}
      {children}
    </div>
  );
};
