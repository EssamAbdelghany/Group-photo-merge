
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // The result from readAsDataURL is a data URL: "data:image/jpeg;base64,..."
      // We need to strip the prefix to get only the base64 string.
      const base64String = result.split(',')[1];
      if (base64String) {
        resolve(base64String);
      } else {
        reject(new Error("Failed to convert file to Base64."));
      }
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};
