export const handleMultipleFilesToBase64 = (
  event: React.ChangeEvent<HTMLInputElement>,
  callback: (base64Images: string[]) => void
) => {
  const files = event.target.files;
  if (files) {
    const base64Array: string[] = [];
    let filesProcessed = 0;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        base64Array.push(reader.result as string);
        filesProcessed++;

        if (filesProcessed === files.length) {
          callback(base64Array);
        }
      };
      reader.readAsDataURL(file);
    });
  }
};
