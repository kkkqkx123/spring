/**
 * Dynamic imports for third-party libraries to enable code splitting
 */

// Chart libraries (loaded only when needed)
export const loadChartLibrary = async () => {
  const [recharts] = await Promise.all([import('recharts')]);
  return recharts;
};

// Date picker library (loaded only when needed)
export const loadDatePicker = async () => {
  const [datePicker] = await Promise.all([import('@mantine/dates')]);
  return datePicker;
};

// Rich text editor (loaded only when needed)
export const loadRichTextEditor = async () => {
  const [editor] = await Promise.all([import('@mantine/rte')]);
  return editor;
};

// File upload utilities (loaded only when needed)
export const loadFileUploadUtils = async () => {
  const [dropzone] = await Promise.all([import('@mantine/dropzone')]);
  return dropzone;
};

// Excel processing library (loaded only when needed)
export const loadExcelProcessor = async () => {
  const [xlsx] = await Promise.all([import('xlsx')]);
  return xlsx;
};

// PDF generation library (loaded only when needed)
export const loadPDFGenerator = async () => {
  const [jsPDF] = await Promise.all([import('jspdf')]);
  return jsPDF;
};

// QR Code generator (loaded only when needed)
export const loadQRCodeGenerator = async () => {
  const [qrcode] = await Promise.all([import('qrcode')]);
  return qrcode;
};

// Image processing utilities (loaded only when needed)
export const loadImageProcessor = async () => {
  const [imageCompression] = await Promise.all([
    import('browser-image-compression'),
  ]);
  return imageCompression;
};

// Markdown processor (loaded only when needed)
export const loadMarkdownProcessor = async () => {
  const [marked] = await Promise.all([import('marked')]);
  return marked;
};

// CSV processing (loaded only when needed)
export const loadCSVProcessor = async () => {
  const [papaparse] = await Promise.all([import('papaparse')]);
  return papaparse;
};

// Animation library (loaded only when needed)
export const loadAnimationLibrary = async () => {
  const [framerMotion] = await Promise.all([import('framer-motion')]);
  return framerMotion;
};

// Validation library extensions (loaded only when needed)
export const loadValidationExtensions = async () => {
  const [yup] = await Promise.all([import('yup')]);
  return yup;
};

// Utility to preload commonly used libraries
export const preloadCommonLibraries = () => {
  // Preload libraries that are likely to be used soon
  const preloadPromises = [loadDatePicker(), loadFileUploadUtils()];

  // Don't await these - just start the loading process
  preloadPromises.forEach(promise =>
    promise.catch(() => {
      // Silently fail - libraries will be loaded when actually needed
    })
  );
};

// Utility to preload libraries based on user role
export const preloadRoleBasedLibraries = (userRoles: string[]) => {
  const preloadPromises: Promise<any>[] = [];

  // HR roles might need Excel processing
  if (
    userRoles.some(role => ['ADMIN', 'HR_MANAGER', 'HR_STAFF'].includes(role))
  ) {
    preloadPromises.push(loadExcelProcessor());
    preloadPromises.push(loadPDFGenerator());
  }

  // Admin roles might need charts and advanced features
  if (userRoles.includes('ADMIN')) {
    preloadPromises.push(loadChartLibrary());
    preloadPromises.push(loadQRCodeGenerator());
  }

  // Don't await these - just start the loading process
  preloadPromises.forEach(promise =>
    promise.catch(() => {
      // Silently fail - libraries will be loaded when actually needed
    })
  );
};
