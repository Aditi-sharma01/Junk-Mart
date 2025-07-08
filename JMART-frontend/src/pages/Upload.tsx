// Add this at the top of the file for TypeScript global declaration
// @ts-ignore
// eslint-disable-next-line
declare global {
  interface Window {
    gapi: any;
    google: any;
    cloudinary: any;
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
  const { register, handleSubmit, control, reset, setValue, formState: { errors } } = useForm();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cloudinary widget open function
  const openCloudinaryWidget = (callback: (url: string) => void) => {
    if (!window.cloudinary) {
      const script = document.createElement('script');
      script.src = 'https://widget.cloudinary.com/v2.0/global/all.js';
      script.onload = () => openCloudinaryWidget(callback);
      document.body.appendChild(script);
      return;
    }
    window.cloudinary.openUploadWidget(
      {
        cloudName: 'df5hqpfbu', // <-- REPLACE with your Cloudinary cloud name
        uploadPreset: 'unsigned_preset', // <-- REPLACE with your unsigned upload preset
        sources: ['local', 'url', 'camera'],
        multiple: false,
        cropping: false,
        folder: 'waste_items',
      },
      (error: any, result: any) => {
        if (!error && result && result.event === 'success') {
          callback(result.info.secure_url);
          setImagePreview(result.info.secure_url);
        }
      }
    );
  };

  const onSubmit = async (data: any) => {
    setError(null);
    setUploading(true);
    try {
      // TODO: Replace with actual user_id logic
      const user_id = 1;
      // Send to backend
      const response = await fetch('http://127.0.0.1:8000/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id,
          description: data.description,
          image_url: data.image_url, // Now using Cloudinary URL
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
                <Label htmlFor="image_url">Image</Label>
                <Button
                  type="button"
                  onClick={() => openCloudinaryWidget((url) => setValue('image_url', url))}
                  disabled={uploading}
                  className="mb-2"
                >
                  Upload Image
                </Button>
                {errors.image_url && <p className="text-red-500 text-sm mt-1">{errors.image_url.message as string}</p>}
                {imagePreview && (
                  <img src={imagePreview} alt="Preview" className="mt-2 max-h-48 rounded" />
                )}
                <input type="hidden" {...register('image_url', { required: 'Image is required' })} />
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
