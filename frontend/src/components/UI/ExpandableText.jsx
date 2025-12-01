import { useState } from 'react';

/**
 * ExpandableText Component
 * Hiển thị text với chức năng "Xem thêm/Ẩn bớt" khi nội dung quá dài
 * 
 * @param {string} text - Nội dung cần hiển thị
 * @param {number} maxLength - Độ dài tối đa trước khi truncate (default: 300)
 * @param {string} className - Custom CSS classes
 * @param {function} renderContent - Custom render function (optional)
 */
const ExpandableText = ({ 
  text, 
  maxLength = 300, 
  className = '', 
  renderContent = null 
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!text) return null;

  const contentLength = text.length;
  const shouldTruncate = contentLength > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? text.substring(0, maxLength) + '...' 
    : text;

  return (
    <div className={className}>
      <p className="whitespace-pre-wrap inline">
        {renderContent ? renderContent(displayText) : displayText}
        {shouldTruncate && (
          <span>
            {' '}
            <span
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer transition-colors inline"
            >
              {isExpanded ? 'Ẩn bớt' : 'Xem thêm'}
            </span>
          </span>
        )}
      </p>
    </div>
  );
};

export default ExpandableText;
