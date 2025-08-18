export type UploadButtonProps = {
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
  accept: string;
};
export const UploadButton = (props: UploadButtonProps) => {
  return (
    <label htmlFor="fileInput" className={`cursor-pointer ${props.className}`}>
      <input
        id="fileInput"
        type="file"
        accept={props.accept}
        className="hidden"
        onChange={props.onChange}
      />
      <span className="text-gray-900 dark:text-white">Upload</span>
    </label>
  );
};
