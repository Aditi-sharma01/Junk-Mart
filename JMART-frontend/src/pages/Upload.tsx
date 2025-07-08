// Add this at the top of the file for TypeScript global declaration
// @ts-ignore
// eslint-disable-next-line
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

import React, { useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { useForm, Controller } from 'react-hook-form';

const GOOGLE_CLIENT_ID = '446600028660-27po8kcln0j3idnkvn2mj62p4ml8rqh0.apps.googleusercontent.com';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive';

const wasteCategories = [
  'Plastic',
  'Metal',
  'Glass',
  'Paper',
  'Electronics',
  'Organic',
  'Other',
];

// Load GIS script
const loadGisScript = () => {
  return new Promise((resolve, reject) => {
    if (window.google && window.google.accounts) return resolve(window.google);
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const loadGapiScript = () => {
  return new Promise((resolve, reject) => {
    if (window.gapi) return resolve(window.gapi);
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', () => resolve(window.gapi));
    };
    script.onerror = reject;
    document.body.appendChild(script);
  });
};

const Upload = () => {
  const { register, handleSubmit, control, reset, formState: { errors } } = useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessTokenRef = useRef<string | null>(null);
  const tokenClientRef = useRef<any>(null);

  // Initialize GIS token client
  const initGis = async () => {
    await loadGisScript();
    tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: SCOPES,
      callback: (tokenResponse: any) => {
        accessTokenRef.current = tokenResponse.access_token;
      },
    });
  };

  // Upload file to Google Drive using GIS access token
  const uploadFileToDrive = async (file: File) => {
    if (!accessTokenRef.current) {
      await initGis();
      await new Promise((resolve) => {
        tokenClientRef.current.callback = (tokenResponse: any) => {
          accessTokenRef.current = tokenResponse.access_token;
          resolve(null);
        };
        tokenClientRef.current.requestAccessToken();
      });
    }
    await loadGapiScript();
    await window.gapi.client.init({}); // No need for clientId here
    const accessToken = accessTokenRef.current;
    const metadata = {
      name: file.name,
      mimeType: file.type,
    };
    const form = new FormData();
    form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
    form.append('file', file);
    // Upload file
    const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id', {
      method: 'POST',
      headers: new Headers({ Authorization: 'Bearer ' + accessToken }),
      body: form,
    });
    const data = await res.json();
    // Set file permission to anyone with the link
    await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}/permissions`, {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + accessToken,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role: 'reader', type: 'anyone' }),
    });
    // Get shareable link
    const fileRes = await fetch(`https://www.googleapis.com/drive/v3/files/${data.id}?fields=webContentLink,webViewLink`, {
      headers: { Authorization: 'Bearer ' + accessToken },
    });
    const fileData = await fileRes.json();
    return fileData.webViewLink || fileData.webContentLink;
  };

  const onImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setImagePreview(null);
    }
  };

  const onSubmit = async (data: any) => {
    setError(null);
    setUploading(true);
    try {
      const file = data.image[0];
      // Upload to Google Drive
      const imageUrl = await uploadFileToDrive(file);
      // TODO: Replace with actual user_id logic
      const user_id = 1;
      // Send to backend
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          description: data.description,
          image_url: imageUrl,
          category: data.category,
        }),
      });
      if (!response.ok) throw new Error('Failed to upload waste item');
      reset();
      setImagePreview(null);
      alert('Waste item uploaded successfully!');
    } catch (err: any) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto animate-fade-in">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Waste Items</h1>
          <p className="text-lg text-gray-600">Help others find value in what you no longer need</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-eco-primary">Upload Waste Item</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div>
                <Label htmlFor="image">Image</Label>
                <Input
                  id="image"
                  type="file"
                  accept="image/*"
                  {...register('image', { required: 'Image is required' })}
                  onChange={e => {
                    register('image').onChange(e);
                    onImageChange(e);
                  }}
                  disabled={uploading}
                />
                {errors.image && <p className="text-red-500 text-sm mt-1">{errors.image.message as string}</p>}
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded" />
                )}
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe your waste item..."
                  {...register('description', { required: 'Description is required' })}
                  disabled={uploading}
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description.message as string}</p>}
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Controller
                  name="category"
                  control={control}
                  rules={{ required: 'Category is required' }}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value} disabled={uploading}>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {wasteCategories.map((cat) => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category.message as string}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={uploading}>{uploading ? 'Uploading...' : 'Upload'}</Button>
              {error && <p className="text-red-500 text-center mt-2">{error}</p>}
            </form>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Upload;
