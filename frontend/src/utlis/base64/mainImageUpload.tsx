export const handleFileToBase64 = (
  event: React.ChangeEvent<HTMLInputElement>,
  callback: (base64: string) => void
) => {
  const file = event.target.files?.[0];
  if (file) {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      callback(base64Image);
    };
    reader.readAsDataURL(file);
  }
};
