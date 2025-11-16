import { useState } from 'react';
import { PiCopySimpleLight, PiCheckLight } from 'react-icons/pi';

interface CopyToClipboardProps {
  text: string;
  className?: string;
}

export const CopyToClipboard = ({
  text,
  className = '',
}: CopyToClipboardProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      className={`p-2 rounded transition-colors ${className}`}
      aria-label={copied ? 'Copied!' : 'Copy to clipboard'}
    >
      {copied ? (
        <PiCheckLight className="w-5 h-5 text-green-600" />
      ) : (
        <PiCopySimpleLight className="w-5 h-5 hover:text-yellow-600" />
      )}
    </button>
  );
};
