
import React from 'react';

interface WhatsAppButtonProps {
    phone?: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ phone }) => {
    if (!phone) return null;
    
    return (
        <a 
            href={`https://wa.me/${phone.replace(/\D/g, '')}`} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="fixed bottom-8 right-8 z-[100] group"
        >
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 blur-xl opacity-40 group-hover:opacity-70 transition-opacity rounded-full animate-pulse" />
                <div className="relative w-14 h-14 md:w-16 md:h-16 bg-[#25D366] rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 transition-all duration-500">
                    <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 md:w-10 md:h-10 fill-white">
                        <path d="M16.003 3C9.375 3 4 8.376 4 15.003c0 2.132.557 4.133 1.528 5.87L4 29l8.392-1.49A12.913 12.913 0 0016.003 28C22.63 28 28 22.625 28 15.997 28 9.373 22.63 3 16.003 3zm6.38 18.376c-.265.744-1.548 1.418-2.116 1.508-.545.087-1.234.124-1.99-.124-.46-.147-1.05-.344-1.808-.673-3.184-1.375-5.262-4.557-5.42-4.767-.159-.21-1.295-1.72-1.295-3.28 0-1.56.82-2.33 1.11-2.645.291-.316.635-.395.847-.395.211 0 .423.002.607.01.195.009.456-.074.713.544.265.636.9 2.196.979 2.355.079.159.132.344.026.554-.105.211-.158.342-.316.527-.158.185-.332.413-.475.554-.158.155-.323.323-.138.634.185.31.822 1.356 1.764 2.197 1.212 1.08 2.235 1.414 2.546 1.572.31.158.49.133.67-.08.185-.211.79-.924 1.001-1.24.211-.317.422-.264.71-.158.291.105 1.85.873 2.168 1.031.317.158.528.237.607.37.079.132.079.764-.185 1.503z"/>
                    </svg>
                </div>
            </div>
        </a>
    );
};
