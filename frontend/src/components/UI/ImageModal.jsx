import { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download } from 'lucide-react';

const ImageModal = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        setCurrentIndex(currentIndex - 1);
        setIsZoomed(false);
      } else if (e.key === 'ArrowRight' && currentIndex < images.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsZoomed(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, images.length, onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsZoomed(false);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsZoomed(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = currentImage;
    link.download = `image-${currentIndex + 1}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black bg-opacity-95 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
        aria-label="Close"
      >
        <X className="w-8 h-8" />
      </button>

      {/* Image Counter */}
      {hasMultipleImages && (
        <div className="absolute top-4 left-4 text-white bg-black bg-opacity-50 px-3 py-2 rounded-lg">
          <span className="text-sm font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 px-4 py-2 rounded-lg">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label={isZoomed ? "Zoom out" : "Zoom in"}
        >
          {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDownload();
          }}
          className="text-white hover:text-gray-300 transition-colors"
          aria-label="Download"
        >
          <Download className="w-5 h-5" />
        </button>
      </div>

      {/* Previous Button */}
      {hasMultipleImages && currentIndex > 0 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handlePrevious();
          }}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Previous image"
        >
          <ChevronLeft className="w-8 h-8" />
        </button>
      )}

      {/* Next Button */}
      {hasMultipleImages && currentIndex < images.length - 1 && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleNext();
          }}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors bg-black bg-opacity-50 rounded-full p-2"
          aria-label="Next image"
        >
          <ChevronRight className="w-8 h-8" />
        </button>
      )}

      {/* Image Container */}
      <div 
        className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <img
          src={currentImage}
          alt={`Image ${currentIndex + 1}`}
          className={`max-w-full max-h-full object-contain transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={(e) => {
            e.stopPropagation();
            setIsZoomed(!isZoomed);
          }}
          style={{
            transformOrigin: 'center center'
          }}
        />
      </div>

      {/* Thumbnail Navigation */}
      {hasMultipleImages && images.length <= 10 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-center gap-2 bg-black bg-opacity-50 p-3 rounded-lg max-w-full overflow-x-auto">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(index);
                setIsZoomed(false);
              }}
              className={`flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${
                index === currentIndex 
                  ? 'border-white scale-110' 
                  : 'border-transparent opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageModal;
