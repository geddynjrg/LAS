import { IconDownload, IconFile } from '@tabler/icons-react';
import type { ValidFile } from '@workspace/ui/lib/zod';
import type { FC } from 'react';

export interface FileLinkProps {
  file: ValidFile | ValidFile[];
  className?: string;
}

export const FileLink: FC<FileLinkProps> = ({ file, className = '' }) => {
  // Handle array of files
  if (Array.isArray(file)) {
    if (file.length === 0) {
      return <span className="text-neutral-500">No files</span>;
    }

    return (
      <div className={`space-y-1 ${className}`}>
        {file.map((f, index) => (
          <FileLinkSingle key={index} file={f} />
        ))}
      </div>
    );
  }

  // Handle single file
  return <FileLinkSingle file={file} className={className} />;
};

const FileLinkSingle: FC<{ file: ValidFile; className?: string }> = ({
  file,
  className = '',
}) => {
  // Check if it's a File object (not yet uploaded)
  if (typeof File !== 'undefined' && file instanceof File) {
    return (
      <div className={`flex items-center gap-1 text-neutral-600 ${className}`}>
        <IconFile className="h-4 w-4" />
        <span>{file.name}</span>
        <span className="text-xs text-neutral-500">(pending upload)</span>
      </div>
    );
  }

  // It's an uploaded file object with url
  const uploadedFile = file as { filename?: string; url?: string };

  if (!uploadedFile.url) {
    return (
      <span className="text-neutral-500">
        {uploadedFile.filename || 'Unknown file'}
      </span>
    );
  }

  return (
    <a
      href={uploadedFile.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1 text-primary underline hover:text-primary/80 ${className}`}
    >
      <IconDownload className="h-4 w-4" />
      <span>{uploadedFile.filename || 'Download file'}</span>
    </a>
  );
};
