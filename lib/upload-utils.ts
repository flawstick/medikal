export const uploadOrgLogo = async (file: File, orgId: string): Promise<string> => {
  try {
    // Get JWT token from current session
    const token = localStorage.getItem('auth-token') || sessionStorage.getItem('auth-token');
    if (!token) {
      throw new Error('Authentication required');
    }

    // Generate unique filename for the organization logo
    const fileExtension = file.name.split('.').pop();
    const filename = `org-logo-${orgId}-${Date.now()}.${fileExtension}`;

    // Request presigned upload URL
    const uploadResponse = await fetch('/api/r2/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        filename,
        contentType: file.type,
      }),
    });

    if (!uploadResponse.ok) {
      throw new Error('Failed to get upload URL');
    }

    const { url, key } = await uploadResponse.json();

    // Upload file to R2
    const fileUploadResponse = await fetch(url, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      },
    });

    if (!fileUploadResponse.ok) {
      throw new Error('Failed to upload file');
    }

    // Return the key which can be used to construct the public URL
    return key;
  } catch (error) {
    console.error('Error uploading organization logo:', error);
    throw error;
  }
};

export const getOrgLogoUrl = (key: string): string => {
  if (!key) {
    return '';
  }
  
  // If it's already a full URL, return as is
  if (key.startsWith('http')) {
    return key;
  }
  
  // Construct public URL using the same pattern as the rest of the app
  const R2_PUBLIC_URL = 
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    'https://pub-4f15c62b4aaf4e09b8e5f3b4d8eae1bb.r2.dev';
  
  return `${R2_PUBLIC_URL}/${key}`;
};

export const updateOrgLogo = async (orgId: string, logoKey: string): Promise<void> => {
  try {
    const response = await fetch(`/api/organizations/${orgId}/logo`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ logo_url: logoKey }),
    });

    if (!response.ok) {
      throw new Error('Failed to update organization logo');
    }
  } catch (error) {
    console.error('Error updating organization logo:', error);
    throw error;
  }
};